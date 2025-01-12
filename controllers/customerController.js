const Customer = require ('../models/customer');
const User = require('../models/user');
const Guid = require('../models/guid');
const Blog = require('../models/blog');
const City = require('../models/city');
const Amenity = require('../models/amenities');
const FoodDining = require('../models/FoodAndDining');
const EventTour = require('../models/tourEvent');
const PropertyType = require('../models/propertyType');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { catchError } = require("../middlewares/CatchError");

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

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;




function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

exports.signup = catchError(async (req, res) => {
 
        const { firstname, lastname, mobile, email, password, dob} = req.body;
        const otp = generateOTP();

        let savedCustomer = null;
    
        const existingCustomer = await Customer.findOne({
         mobile,
        });
        if(existingCustomer){
            return res.status(400).json({ message: 'User with Entered Mobile Number is already exists' });
          


        }
        const file = req.s3FileUrl;


          const newCustomer = new Customer({
            firstname,
            lastname,
            mobile,
            email,
            password:password,
            email_otp: null,
            mobile_otp: otp,
            dob: dob,
            age:null,
            latitude: null,
            longitude: null,
            mobile_verified_at: null,
            email_verified_at: null,
            file: file,
          });
      
         savedCustomer =  await newCustomer.save();

        

      //  if(savedCustomer){
      //     const accountSid = process.env.TWILIO_ACCOUNT_SID;
      //     const authToken = process.env.TWILIO_AUTH_TOKEN;
      //     const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      //     // Create a Twilio client
      //     const twilio = require('twilio')(accountSid, authToken);
          
      //     // Send OTP message
      //     const message = await twilio.messages.create({
      //         body: `Your OTP code is: ${otp}`,
      //         from: twilioPhoneNumber,
      //         to: mobile
      //     });
      
      //     if (message) {
      //         console.log('OTP sent successfully:', message.sid);
      //     } else {
      //         console.error('Failed to send OTP.');
      //     }
      //  }

    
        return res.status(201).json({ message: 'Customer created successfully! Please verify your number with otp sent to your mobile' });
});


exports.verifyOtp = catchError(async(req, res)=>{
  const {otp, mobile} = req.body;
  //validation on email and password
  if(!otp || !mobile) {
      return res.status(400).json({
          success:false,
          message:'Invalid Inputs!',
      });
  }
  let customer = await Customer.findOne({mobile});
  if(customer.mobile_otp != otp){
    return res.status(401).json({
      success:false,
      message: "Invalid Otp"
    });
  }

  const payload = {
      mobile:customer.mobile,
      _id:customer._id
  };
  let token =  jwt.sign(payload, 
    process.env.JWT_SECRET,
    {
        expiresIn:"365d",
    });

  customer.mobile_otp = null;
  customer.mobile_verified_at = Date.now();
  await customer.save();
  customer = customer.toObject();
  customer.token = token;

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
})

exports.login = async (req,res) => {
  try {

      //data fetch
      const {mobile} = req.body;
      //validation on email and password
      if(!mobile) {
          return res.status(400).json({
              success:false,
              message:'PLease enter the mobile number',
          });
      }

      //check for registered user
      let customer = await Customer.findOne({mobile});
      //if not a registered user
      if(!customer) {
          return res.status(401).json({
              success:false,
              message:'customer is not registered',
          });
      }

      const otp = generateOTP();
      customer.mobile_otp = otp;
      await customer.save();

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
      // Create a Twilio client
      const twilio = require('twilio')(accountSid, authToken);
      
      // Send OTP message
      const message = await twilio.messages.create({
          body: `Your OTP code is: ${otp}`,
          from: twilioPhoneNumber,
          to: mobile
      });
  
      if (message) {
          console.log('OTP sent successfully:', message.sid);
      } else {
          console.error('Failed to send OTP.');
      }

      return res.status(200).json({message:"Otp sent to your mobile number please verify"});

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            data: error,
            message:'Login Failure',
        });

    }
}


exports.auth = catchError(async (req, res) => {
  const { mobile } = req.body;

  // Validate input
  if (!mobile) {
      return res.status(400).json({
          success: false,
          message: 'Please enter the mobile number',
      });
  }

  // Generate OTP
  const otp = generateOTP();
  let savedCustomer;

  // Check if customer already exists
  let customer = await Customer.findOne({ mobile });

  if (customer) {
      // If customer exists but is already verified
      if (customer.mobile_verified_at != null) {
          // Update OTP for existing customer
          customer.mobile_otp = otp;
          savedCustomer = await customer.save();
      } else {
          // If customer exists but not verified, update info and OTP
          customer.mobile_otp = otp;
          savedCustomer = await customer.save();
      }
  } else {
      // If customer does not exist, create a new one with OTP
      const newCustomer = new Customer({
          mobile,
          mobile_otp: otp,
          mobile_verified_at: null,
          // Additional fields with null values or defaults
          firstname: null,
          lastname: null,
          email: null,
          password: null,
          email_otp: null,
          dob: null,
          age: null,
          latitude: null,
          longitude: null,
          email_verified_at: null,
          file: null,
      });

      savedCustomer = await newCustomer.save();
  }

  // Send OTP using Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const twilio = require('twilio')(accountSid, authToken);
  const message = await twilio.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: twilioPhoneNumber,
      to: mobile
  });

  if (message) {
      console.log('OTP sent successfully:', message.sid);
  } else {
      console.error('Failed to send OTP.');
  }

  return res.status(200).json({
      message: customer ? "OTP sent for login verification" : "OTP sent for signup verification",
  });
});

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
    
        const { firstname, lastname, email, mobile, dob } = req.body;
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
            { firstname, lastname, email, mobile, dob, age, file, updatedBy, updatedAt: Date.now() },
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

    const { firstname, lastname, email, mobile, dob } = req.body;
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
        {firstname, lastname, email, mobile, dob, age,  file, updatedBy, updatedAt: Date.now() },
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

    const customer = await Customer.findById(customerId).select('-password').populate('wishlist');

    if (!customer) {
      return res.status(404).json({ message: 'customer not found' });
    }

    const wishlistDetails = await Promise.all(customer.wishlist.map(async (wishlistItem) => {
      console.log(wishlistItem._id);
      const hotel = await User.findById(wishlistItem._id)
      .populate('amenitiesId', 'name')
      .populate('propertyTypeId', 'name')
      .populate('foodAndDiningId', 'name')
      .select('-password')
      .exec();
    
    if (!hotel) {
      return null; // Handle the case where the product is not found
    }
    
      return hotel;
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
   

    if (!customer.wishlist.includes(userId)) {
      customer.wishlist.push(userId);
      await customer.save();
    }

    return res.status(200).json({data:customer, message: 'Added to wishlist successfully' });
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

    const productIndex = customer.wishlist.indexOf(userId);
    if (productIndex !== -1) {
      customer.wishlist.splice(productIndex, 1); // Remove the product from the wishlist array
      await customer.save();
      return res.status(200).json({ message: 'Removed from wishlist successfully' });
    } else {
      return res.status(404).json({ message: 'Not found in wishlist' });
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

const sendOtp = catchError(async(mobile) =>{
  const otp = generateOTP();
  const message = await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: twilioPhoneNumber,
      to: mobile
  });

  console.log(`OTP sent successfully: ${message.sid}`);
  return  otp ;

})

exports.search = catchError(async (req, res) => {
  const { tag, search } = req.query;

  try {
      let usersData = [];
      let guidesData = [];
      let blogsData = [];
      let tourAndEvents = [];

      if (tag === "city") {
          const cities = await City.find({ name: new RegExp(search, 'i') });
          const cityIds = cities.map(city => city._id);
              usersData = await User.find({ cityId: { $in: cityIds } })
                  .populate('amenitiesId')
                  .populate('foodAndDiningId')
                  .populate('propertyTypeId');

              guidesData = await Guid.find({ cityId: { $in: cityIds } });
              blogsData = await Blog.find({ cityId: { $in: cityIds } });
              tourAndEvents = await EventTour.find({ cityId: { $in: cityIds } });
          
      }

      if (tag === "hotel") {
          // Search in Users table for name, hotelName, amenitiesId, propertyTypeId, and foodAndDiningId
          const amenities = await Amenity.find({ name: new RegExp(search, 'i') });
          const foodDining = await FoodDining.find({ name: new RegExp(search, 'i') });
          const propertyTypes = await PropertyType.find({ name: new RegExp(search, 'i') });

          const amenitiesIds = amenities.map(amenity => amenity._id);
          const foodDiningIds = foodDining.map(food => food._id);
          const propertyTypeIds = propertyTypes.map(type => type._id);

          usersData = await User.find({
              $or: [
                  { name: new RegExp(search, 'i') },
                  { hotelName: new RegExp(search, 'i') },
                  { amenitiesId: { $in: amenitiesIds } },
                  { foodAndDiningId: { $in: foodDiningIds } },
                  { propertyTypeId: { $in: propertyTypeIds } }
              ]
          }).populate('amenitiesId').populate('foodAndDiningId').populate('propertyTypeId');
          const cityIds = usersData.map(city => city._id);

          guidesData = await Guid.find({ cityId: { $in: cityIds } });
          blogsData = await Blog.find({ cityId: { $in: cityIds } });
          tourAndEvents = await EventTour.find({ cityId: { $in: cityIds } });
      }

      if (tag === "guide") {
          guidesData = await Guid.find({ name: new RegExp(search, 'i') });
          const cityIds = guidesData.map(city => city._id);
          usersData = await User.find({ cityId: { $in: cityIds } })
              .populate('amenitiesId')
              .populate('foodAndDiningId')
              .populate('propertyTypeId');

          blogsData = await Blog.find({ cityId: { $in: cityIds } });
          tourAndEvents = await EventTour.find({ cityId: { $in: cityIds } });
      }

      if (tag === "search_all") {
        // Step 1: Search in Users
        usersData = await User.find({
            $or: [
                { name: new RegExp(search, 'i') },
                { hotelName: new RegExp(search, 'i') }
            ]
        }).populate('amenitiesId').populate('foodAndDiningId').populate('propertyTypeId');
    
        // Step 2: Search in Guides
        guidesData = await Guid.find({ name: new RegExp(search, 'i') });
    
        // Step 3: Search in Blogs
        blogsData = await Blog.find({
            $or: [
                { title: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ]
        });
    
        // Step 4: Search in Tours and Events
        tourAndEvents = await EventTour.find({
            $or: [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ]
        });
    
        // Step 5: Collect all cityIds from the results
        const cityIds = new Set();
    
        usersData.forEach(user => user.cityId && cityIds.add(user.cityId));
        guidesData.forEach(guide => guide.cityId && cityIds.add(guide.cityId));
        blogsData.forEach(blog => blog.cityId && cityIds.add(blog.cityId));
        tourAndEvents.forEach(event => event.cityId && cityIds.add(event.cityId));
    
        const cityIdArray = Array.from(cityIds);
    
        // Step 6: Cross-query remaining data using cityIds
        if (cityIdArray.length > 0) {
            // Fetch additional users
            const additionalUsers = await User.find({ cityId: { $in: cityIdArray } })
                .populate('amenitiesId')
                .populate('foodAndDiningId')
                .populate('propertyTypeId');
    
            // Fetch additional guides
            const additionalGuides = await Guid.find({ cityId: { $in: cityIdArray } });
    
            // Fetch additional blogs
            const additionalBlogs = await Blog.find({ cityId: { $in: cityIdArray } });
    
            // Fetch additional tours and events
            const additionalTourAndEvents = await EventTour.find({ cityId: { $in: cityIdArray } });
    
            // Append additional data
            usersData = [...usersData, ...additionalUsers];
            guidesData = [...guidesData, ...additionalGuides];
            blogsData = [...blogsData, ...additionalBlogs];
            tourAndEvents = [...tourAndEvents, ...additionalTourAndEvents];
        }
      }
    

      const result = {
          users: usersData,
          guides: guidesData,
          blogs: blogsData,
          eventAndtours: tourAndEvents
      };

      return res.status(200).json(result);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred while searching.' });
  }
});

