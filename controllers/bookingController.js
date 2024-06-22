const Booking = require('../models/booking');
const User = require('../models/user');
const Customer = require('../models/customer');
const admin =require('../config/firebase-config');
const { response } = require('express');
const { CustomerProfiles } = require('aws-sdk');
const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };
exports.bookEscort = async(req, res) =>{
    try {
        const authenticatedUser = req.customer;

        const customerId = authenticatedUser._id;
        const {userId, serviceId, bookingDate, bookingTime, bookingHrs } = req.body;

        const escort = await User.findById(userId);

        const price = escort.price;
        const [hrs, minutes] = bookingHrs.split(':').map(Number);
        const [hours, minute] = bookingTime.split(':').map(Number);
        const bookingHrsDecimal = hrs + (minutes / 60);

        // Calculate total price
        const totalPrice = price * bookingHrsDecimal;

        const currentDate = new Date();
        
        const requestedBookingDate = new Date(bookingDate);
        requestedBookingDate.setHours(hours, minute, 0, 0);

        // Check if bookingDate is in the past
        if (requestedBookingDate < currentDate) {
            return res.status(400).json({ message: 'Booking date cannot be in the past.' });
        }
        const bookingEndTime = addBookingHrsToTime(bookingTime, bookingHrs);

        const existingBooking =  await Booking.findOne({userId:userId, bookingDate: bookingDate, bookingTime: { $gte: bookingTime, $lte: bookingEndTime }, bookingStatus:"accepted"});

        if(existingBooking){  
            return res.status(400).json({ message: 'This Escort is Already Booked At Selected Date and Time. Please Choose diffrent time slot to get service!' });
        }
        const myexistingBooking = await Booking.findOne({
            userId: userId,
            bookingDate: bookingDate,
            bookingTime: { $gte: bookingTime, $lte: bookingEndTime },
            $or: [
                { bookingStatus: "pending" },
                { bookingStatus: "accepted" }
            ],
            customerId: customerId
        });
        if(myexistingBooking){  
            return res.status(400).json({ message: 'You Have Already booked This Escort For Given Slot!' });
        }
        const newbooking = new Booking({
            userId,
            customerId, 
            serviceId,
            bookingDate,
            bookingTime,
            bookingHrs,
            amount : totalPrice,
        });
        const name = authenticatedUser.name;
        const escortDeviceToken = escort.deviceId;  // Assuming you have a device token for the escort
        const payload = {
          notification: {
            title: 'Booking Confirmation',
            body: name + ' ' + ' ' +'has sent booking request.'
          }
        };
    
        await admin.messaging().send({
          token: escortDeviceToken,
          notification: payload.notification
        })
        .then( response => {

        response.status(200).send("Notification sent successfully")
        
        })
        .catch( error => {
            console.log(error);
        });
        await newbooking.save();
        await User.updateOne({ _id: userId }, { $inc: { bookedCount: 1 } });
        return res.status(201).json({ message: 'You Booked Escort successfully' });
    } catch ({error}) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
}

exports.getAllBooking = async(req, res) =>{
    try {
        const bookings = await Booking.find().populate('userId', 'name').populate('customerId', 'name').populate('serviceId', 'name').exec();

        if(!bookings){
            
        return res.status(404).json({ message: 'No data Found' });
        }
  
        return res.status(201).json(bookings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
        
    }
}

exports.getBookingById = async(req, res) =>{
    try {
        const bookinId = req.params.id;

        const booking = await Booking.findById(bookinId).populate('userId', 'name').populate('customerId', 'name').populate('serviceId', 'name').exec();

        if(!booking){ 
            return res.status(404).json({ message: 'No data Found' });

        }
        return res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
        
    }
}

exports.getEscortBooking = async(req, res) =>{
    try {
        const authenticatedUser = req.user;

        const userId = authenticatedUser._id;
        const { bookingStatus } = req.query;

        let query = { userId };

        // If bookingStatus is provided, add it to the query
        if (bookingStatus) {
        query.bookingStatus = bookingStatus;
        }
    
        const booking = await Booking.find(query)
          .populate('customerId','-password')
          .populate('serviceId', 'name')
          .exec();
        if(!booking){ 
            return res.status(404).json({ message: 'No data Found' });

        }
        return res.status(201).json({booking});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
        
    }
}

exports.getBookingByCustomer = async(req, res) =>{
    try {
        const authenticatedUser = req.customer;

        const customerId = authenticatedUser._id;
        const { bookingStatus, name } = req.query;

        let query = { customerId };

        // If bookingStatus is provided, add it to the query
        if (bookingStatus) {
        query.bookingStatus = bookingStatus;
        }


        const bookings = await Booking.find(query)
        .populate({
            path: 'userId',
            select: '-password',
            populate: {
                path: 'serviceIds',
                model: 'Service'
            }
        }).populate('serviceId', 'name').exec();
        
        if(!bookings){ 
            return res.status(404).json({ message: 'No data Found' });

        }
          // Filter the bookings based on userName
          if(name){
            const filteredBookings = bookings.filter(booking => {
                const user = booking.userId;
                return user && user.name && user.name.toLowerCase().includes(name.toLowerCase());
            });
            return res.status(200).json({ bookings: filteredBookings });

          }

        return res.status(201).json({bookings});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
        
    }
}


exports.updateBookingStatus = async(req, res) =>{
    try {
        const bookingId = req.params.id;
        const status = req.body.status;

        const updateStatus = await Booking.findOneAndUpdate(
            {_id:bookingId},
            {bookingStatus: status},
            {new:true}
          );
          if (!updateStatus) {
            console.log(`Booking with ID ${req.body.UserId} not found`);
            return res.status(404).json({ error: 'Booking not found' });
          }

        const customerId = updateStatus.customerId;
        const customer = await Customer.findById(customerId);
        const token = customer.deviceId;
        const authenticatedUser = req.user;

        const name = authenticatedUser.name;
        const payload = {
            notification: {
              title: 'Booking Status',
              body:  name + ' ' + status + ' ' + 'your booking'
            }
          };
      
          await admin.messaging().send({
            token: token,
            notification: payload.notification
          });
          res.json({ message: 'Booking Status Updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to Update Status' });
    }
    
};

function addBookingHrsToTime(bookingTime, bookingHrs) {
    const [bookingTimeHours, bookingTimeMinutes] = bookingTime.split(':').map(Number);
    const [bookingHrsHours, bookingHrsMinutes] = bookingHrs.split(':').map(Number);

    let totalHours = bookingTimeHours + bookingHrsHours;
    let totalMinutes = bookingTimeMinutes + bookingHrsMinutes;

    // Adjust hours and minutes
    if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
    }

    return `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}`;
}