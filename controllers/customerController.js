const Customer = require ('../models/customer');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
require("dotenv").config();
const nodemailer = require('nodemailer');

const { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDsJjN0sFH0YORl7_lK0QfP7ltf7CIJSho",
  authDomain: "naughty-nz.firebaseapp.com",
  projectId: "naughty-nz",
  storageBucket: "naughty-nz.appspot.com",
  messagingSenderId: "1093026425987",
  appId: "1:1093026425987:web:4c04a6bf43f06bbe73ffb6",
  measurementId: "G-G18XR8BH4C"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

exports.signup = async(req,res) =>{
    try {
        const { name, email, mobile, password, username } = req.body;
    
        // Check if the email or mobile already exists in the database
        const existingCustomer = await Customer.findOne({
          $or: [{ email }, { mobile }, { username }],
        });
    
        if (existingCustomer) {
          return res.status(400).json({ message: 'Email or mobile or Username already exists' });
        }
    
        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        // Create the new customer object with the hashed password
        const newCustomer = new Customer({
          name,
          email,
          mobile,
          password: hashedPassword,
          username,
          email_otp: null,
          mobile_otp: null,
          dob: null,
          age:null,
          latitude: null,
          longitude: null,
          mobile_verified_at: null,
          email_verified_at: null,
          file: null,
        });
    
        // Save the new customer to the database
        await newCustomer.save();

        createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('User UID:', user.uid);

        const newFirestoreUser = {
          uid: user.uid,
          email: user.email,
          name: newCustomer.name,
          image: '',
          isOnline: true,
          lastActive: new Date(),
          chatParticipants: [],
        };

        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, newFirestoreUser);

        console.log('Document successfully written to Firestore');
      })
      .catch((error) => {
        console.error('Error during Firebase user creation:', error);
        return res.status(500).json({ message: 'Error during Firebase user creation' });
      });
    
        return res.status(201).json({ message: 'Customer created successfully' });
      } catch (error) {
        console.error('Error during customer signup:', error);
        return res.status(500).json({ message: 'Something went wrong' });
      }
}

exports.login = async (req,res) => {
    try {

        //data fetch
        const {email, password, token} = req.body;
        //validation on email and password
        if(!email || !password) {
            return res.status(400).json({
                success:false,
                message:'PLease fill all the details carefully',
            });
        }

        //check for registered user
        let customer = await Customer.findOne({email});
        //if not a registered user
        if(!customer) {
            return res.status(401).json({
                success:false,
                message:'customer is not registered',
            });
        }
        console.log(customer._id)
        if(token){
          customer.deviceId = token;
          customer.save();
          }
        const payload = {
            email:customer.email,
            _id:customer._id,
        };
        //verify password & generate a JWT token
        // if(await bcrypt.compare(password,customer.password) ) {
            //password match

            signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              // Signed in 
              const user = userCredential.user;
              let token =  jwt.sign(payload, 
                process.env.JWT_SECRET,
                {
                    expiresIn:"15d",
                });                          

                    customer = customer.toObject();
                    customer.token = token;
                    customer.password = undefined;

                    const options = {
                    expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                    httpOnly:true,
                    sameSite: 'none',
                    secure: true,
                    }

                    res.cookie("token", token, options).status(200).json({
                    success:true,
                    token,
                    customer,
                    message:'customer Logged in successfully',
                });
              // ...
            })
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;
            });

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
      const authenticatedUser = req.customer;
  
      const customerId = authenticatedUser._id;
  
      const customer = await Customer.findById(customerId).select('-password');
  
      if (!customer) {
        return res.status(404).json({ message: 'customer not found' });
      }

  
      return res.json({ customer });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.updateMyProfile = async(req, res) =>{
        const authenticatedUser = req.customer;
        
        const customerId = authenticatedUser._id;
    
        const { name, email, mobile, dob, username } = req.body;
        const updatedBy = req.customer.id;
    
       
    const file = req.s3FileUrl;
    
        try {
          const existingCustomer = await Customer.findById(customerId);
    
          if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
          }
    
          // Check if the provided email or mobile already exist for other customers
          const duplicateCustomer = await Customer.findOne({
            $and: [
              { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
              { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
            ],
          });
    
          if (duplicateCustomer) {
            return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
          }

          // Calculate age based on dob and current date
          let age = undefined;
          if(dob !== null && dob !== undefined && dob !== ''){
          const birthDate = new Date(dob);
          const currentDate = new Date();
           age = currentDate.getFullYear() - birthDate.getFullYear();

          // Check if the birthday has already occurred this year
          if (
            currentDate.getMonth() < birthDate.getMonth() ||
            (currentDate.getMonth() === birthDate.getMonth() &&
              currentDate.getDate() < birthDate.getDate())
          ) {
            age--;
          }
        }
          const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            { name, email, mobile, dob, age, username, file, updatedBy, updatedAt: Date.now() },
            { new: true }
          );
    
          console.log(updatedCustomer); // Add this line for debug logging
          res.json({customer:updatedCustomer});
        } catch (error) {
          console.error(error); // Add this line for debug logging
          return res.status(500).json({ error: 'Failed to update Customer' });
        }
      
};


exports.getAllCustomers = async (req, res)  => {
    try {
        const customers = await Customer.find().select('-password');
        
        res.json(customers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
  
  
exports.getCustomerById = async (req, res) => {
  try {
      const customer = await Customer.findById(req.params.id).select('-password');
      if (!customer) {
      console.log(`customer with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'customer not found' });
      }

    

      res.json(customer);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

exports.updateCustomer = async(req,res) =>{

    const { name, email, mobile, dob, username } = req.body;
    const updatedBy = req.user.id;

    const file = req.s3FileUrl;

    try {
      const existingCustomer = await Customer.findById(req.params.id);

      if (!existingCustomer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if the provided email or mobile already exist for other customers
      const duplicateCustomer = await Customer.findOne({
        $and: [
          { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
          { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
        ],
      });

      if (duplicateCustomer) {
        return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
      }
      let age = undefined;
      if(dob !== null && dob !== undefined && dob !== ''){
        const dateParts = dob.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const day = parseInt(dateParts[2], 10);
        const birthDate = new Date(year, month, day);
      
        const currentDate = new Date();
         age = currentDate.getFullYear() - birthDate.getFullYear();

        // Check if the birthday has already occurred this year
        if (
          currentDate.getMonth() < birthDate.getMonth() ||
          (currentDate.getMonth() === birthDate.getMonth() &&
            currentDate.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }
      

      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        { name, email, mobile, dob, age, username, file, updatedBy, updatedAt: Date.now() },
        { new: true }
      );

      console.log(updatedCustomer); // Add this line for debug logging
      res.json(updatedCustomer);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Customer' });
    }
};


exports.getMyFavorite = async(req, res) =>{
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;

    const customer = await Customer.findById(customerId).select('-password').populate('favorites');

    if (!customer) {
      return res.status(404).json({ message: 'customer not found' });
    }

    const wishlistDetails = await Promise.all(customer.favorites.map(async (wishlistItem) => {
      console.log(wishlistItem._id);
      const escort = await User.findById(wishlistItem._id)
        .populate('serviceIds', 'name')
        .exec();
    
    if (!escort) {
      return null; // Handle the case where the product is not found
    }
    
      return escort;
  }));

    return res.json({ wishlistDetails });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

exports.addTofavorite = async (req, res) => {
  try {

    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const {userId } = req.body; 

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    console.log('userId:', userId);
    console.log('customer.favorites:', customer.favorites);

    if (!customer.favorites.includes(userId)) {
      customer.favorites.push(userId);
      console.log('Customer after adding to favorites:', customer);
      await customer.save();
    }

    return res.status(200).json({data:customer, message: 'Added As Favirate successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};

exports.removeFromFavorite = async (req, res) => {
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const { userId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const productIndex = customer.favorites.indexOf(userId);
    if (productIndex !== -1) {
      customer.favorites.splice(productIndex, 1); // Remove the product from the wishlist array
      await customer.save();
      return res.status(200).json({ message: 'Removed from favorites successfully' });
    } else {
      return res.status(404).json({ message: 'Not found in favorites' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};

exports.updateRecentlyViewedEscorts = async(req, res) => {
  try {

    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const userId =req.params.id;
    // Find the customer by their ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Add the escort to the recently viewed list
    if (!customer.recentlyViewedEscorts.includes(userId)) {
      customer.recentlyViewedEscorts.unshift(userId);

      // Limit the recently viewed list to a certain number (e.g., 10)
      if (customer.recentlyViewedEscorts.length > 10) {
        customer.recentlyViewedEscorts.pop();
      }

      await customer.save();
      return res.status(200).json({ message: 'Done' });;
    }
  } catch (error) {
    console.error('Error updating recently viewed escorts:', error);
    throw error;
  }
};

exports.getMyRecentView =  async(req, res) =>{
  const authenticatedUser = req.customer;

  const customerId = authenticatedUser._id;

  try {
    // Find the customer by their ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get the IDs of recently viewed escorts
    const recentlyViewedEscortIds = customer.recentlyViewedEscorts;

    // Use the $in operator to fetch all escort documents by their IDs
    const recentlyViewedEscorts = await User.find({
      _id: { $in: recentlyViewedEscortIds },
    }).select('-password').populate('serviceIds').exec();

    // Now you have an array of Escort documents with their details
    return res.json({users:recentlyViewedEscorts});
  } catch (error) {
    console.error('Error getting recently viewed escorts:', error);
    throw error;
  }
};

exports.forgotCustomerPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ message: 'customer not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP to the user model
    customer.otp = otp;
    await customer.save();

    // Send OTP to the user's email
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error during OTP generation and sending:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const sendOtpEmail = async (email, otp) => {
  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      auth: {
          user: "webienttechenv@gmail.com",
          pass: "ljxugdpijagtxeda",
      },
  });

  // Email content
  const mailOptions = {
    from: 'webienttechenv@gmail.com',  // Replace with your email
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

exports.resetCustomerPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const customer = await Customer.findOne({ email, otp });

    if (!customer) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New Password and Confirm Password mismatch' });
    }

    // Hash the new password and save it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    customer.password = hashedPassword;

    // const userDocRef = doc(firestore, 'users', email);
    // await setDoc(userDocRef, {
    //   password: hashedPassword,
    //   lastPasswordUpdate: serverTimestamp()
    // }, { merge: true });

    customer.otp = null; // Clear OTP
    await customer.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updateCustomerPassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const authenticatedUser = req.customer;

  const customerId = authenticatedUser._id; // Assuming you have user information in req.user

  try {
    // Find the user by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Uscustomerer not found' });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, customer.password);

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
    customer.password = hashedPassword;
    await customer.save();
    // const userDocRef = doc(firestore, 'users', email);
    //     await setDoc(userDocRef, {
    //       password: hashedPassword,
    //       lastPasswordUpdate: serverTimestamp()
    //     }, { merge: true });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error during password update:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.deleteCustomer = async(req, res) =>{
  try {
    const deleteUser = await Customer.findByIdAndDelete(req.params.id);
    console.log('Deleted User:', deleteUser);
    
    if (!deleteUser) {
      console.log(`Customer with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete Customer' });
  }
}