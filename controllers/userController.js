const User = require("../models/user");
const Rating = require('../models/rating');
const Booking = require('../models/booking');
const Services = require('../models/service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();
const admin = require('firebase-admin'); 
const serviceAccount = require('../dham.json');
const { Service } = require("aws-sdk");
const emailEmitter = require('../events/userSignupEvent');

exports.signUp = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if the email or mobile already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }

    // Hash the password before saving it to the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

   
    
    await newUser.save();
    emailEmitter.emit('sendEmailOtp', newUser);

    console.log('ssafsd')
    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during customer signup:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};
  
exports.login = async (req,res) => {
    try {

        //data fetch
        const {email, password} = req.body;
        //validation on email and password
        if(!email || !password) {
            return res.status(400).json({
                success:false,
                message:'PLease fill all the details carefully',
            });
        }

        //check for registered user
        let user = await User.findOne({email});
        //if not a registered user
        if(!user) {
            return res.status(401).json({
                success:false,
                message:'User is not registered',
            });
        }
        if(user.role != "Admin"){
          return res.status(401).json({
            success:false,
            message:'You Are Not Admin',
        });
        }

        if(await bcrypt.compare(password,user.password) ) {
          const otp = Math.floor(100000 + Math.random() * 900000);

          user.otp = otp;
          await user.save();
      
          await sendOtpEmail(email, otp, 'login');
          return res.status(200).json({
              success:true,
              message:`Otp sent to your email ${email} successfully!`,
          });

        }
        else {
            return res.status(403).json({
                success:false,
                message:"Password Incorrect",
            });
        }

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure',
        });

    }
}

exports.loginHotel = async (req,res) => {
  try {

      const {email, password, token} = req.body;
      if(!email || !password) {
          return res.status(400).json({
              success:false,
              message:'PLease fill all the details carefully',
          });
      }
      let user = await User.findOne({email});
      if(!user) {
          return res.status(401).json({
              success:false,
              message:'User is not registered',
          });
      }
      if(user.role != "Hotel"){
        return res.status(401).json({
          success:false,
          message:'You Are Not Hotel',
      });
      }

      if(user.email_verified_at == null){
        return res.status(401).json({
            success:false,
            message:'Email Not Varified yet. Please verify you email.',
        });
      }

      if(user.status == "inactive"){
        return res.status(401).json({
            success:false,
            message:'Your Account is Inactive. Please Contact Admin.',
        });
      }
      
      if(await bcrypt.compare(password,user.password) ) {
        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = otp;
        await user.save();
    
        await sendOtpEmail(email, otp, 'login');
        return res.status(403).json({
            success:true,
            message:`Otp sent to your email ${email} successfully!`,
        });

      }
      else {
          return res.status(403).json({
              success:false,
              message:"Password Incorrect",
          });
      }
  }
  catch(error) {
      console.log(error);
      return res.status(500).json({
          success:false,
          message:'Login Failure',
      });

  }
}

exports.getMyProfile = async (req, res) => {
  try {
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const user = await User.findById(userId)
    .select('-password')
    .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);
    if (!deleteUser) {
      console.log(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete User' });
  }
};

exports.updateUserStatus =async(req, res) =>{
  try {
    const updateStatus =await User.findOneAndUpdate(
      {_id:req.body.userId},
      {status: req.body.status},
      {new:true}
    );
    if (!updateStatus) {
      console.log(`User with ID ${req.body.UserId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User Status Updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to Update Status' });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email:email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP to the user model
    user.otp = otp;
    await user.save();

    // Send OTP to the user's email
    await sendOtpEmail(email, otp, 'password');

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error during OTP generation and sending:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const sendOtpEmail = async (email, otp, source) => {
  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      auth: {
          user: "abhisheksinghraizada12@gmail.com",
          pass: "izxsgwtfzgaffrem",
      },
  });

  if(source == 'password'){
    text = `Your OTP for password reset is: ${otp}`;
    subject = 'Password Reset OTP';
  }

  
  if(source == 'login'){
    text = `Your Login OTP is: ${otp}`;
    subject = 'Login OTP';
  }
  
  const mailOptions = {
    from: 'abhisheksinghraizada12@gmail.com',  // Replace with your email
    to: email,
    subject: subject,
    text: text
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New Password and Confirm Password mismatch' });
    }

    // Hash the new password and save it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;

    user.otp = null; 
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const authenticatedUser = req.user;

  const userId = authenticatedUser._id; // Assuming you have user information in req.user
  const email = authenticatedUser.email;
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Validate the new password and confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the user document
    user.password = hashedPassword;
    await user.save();
    // const userDocRef = doc(firestore, 'users', email);
    // await setDoc(userDocRef, {
    //   password: hashedPassword,
    //   lastPasswordUpdate: serverTimestamp()
    // }, { merge: true });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error during password update:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.verifyOtp = async(req,  res) =>{
  const {otp, email} = req.body;
  //validation on email and password
  if(!otp || !email) {
      return res.status(400).json({
          success:false,
          message:'Otp is required!',
      });
  }
  let user = await User.findOne({email});
  if(user.otp != otp){
    return res.status(401).json({
      success:false,
      message: "Invalid Otp"
    });
  }

  const payload = {
      email:user.email,
      _id:user._id,
      role:user.role,
  };
  let token =  jwt.sign(payload, 
    process.env.JWT_SECRET,
    {
        expiresIn:"15d",
    });

  user.otp = null;
  await user.save();
  user = user.toObject();
  user.token = token;
  user.password = undefined;

  const options = {
  expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
  httpOnly:true,
  sameSite: 'none',
  secure: true,
  }

  res.cookie("token", token, options).status(200).json({
  success:true,
  token,
  user,
  message:'User Logged in successfully',
  });
}

exports.verifyEmail = async(req, res) =>{
  const {otp, email} = req.body;
  //validation on email and password
  if(!otp || !email) {
      return res.status(400).json({
          success:false,
          message:'Otp is required!',
      });
  }
  let user = await User.findOne({email});
  if(user.email_otp != otp){
    return res.status(401).json({
      success:false,
      message: "Invalid Otp"
    });
  }
  user.email_otp = null;
  user.email_verified_at = Date.now();
  user.save();
  return res.status(200).json({message:"Email Verified Successfully!"});
}




