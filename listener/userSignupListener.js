const emailEmitter = require('../events/userSignupEvent');
const sendMail = require('../utils/sendMail');
const User = require('../models/user');

emailEmitter.on('sendEmailOtp', async (user) => {
 const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
 user.email_otp = otp;

  // Save the user with the new OTP
 await user.save();

  // Define the email content
 const subject = 'Welcome to Our Service';
 const templatePath = 'welcomeEmail.html'; // Update this path as necessary
 const context = { name: user.name, otp };

  // Send the email
 await sendMail(user.email, subject, templatePath, context);
});
