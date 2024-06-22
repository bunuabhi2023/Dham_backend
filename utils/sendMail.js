const nodemailer = require('nodemailer');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');

const sendMail = async (to, subject, templatePath, context) => {
  // Configure the transporter
 const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      auth: {
          user: "abhisheksinghraizada12@gmail.com",
          pass: "izxsgwtfzgaffrem",
      },
 });

 // Read and compile the template
 const templateSource = fs.readFileSync(path.join(__dirname, '..', 'templates', templatePath), 'utf8');
  const template = handlebars.compile(templateSource);
 const html = template(context);

  // Define email options
 const mailOptions = {
    from: 'abhisheksinghraizada12@gmail.com',
    to,
    subject,
    html,
 };

  // Send the email
 return transporter.sendMail(mailOptions);
};

module.exports = sendMail;
