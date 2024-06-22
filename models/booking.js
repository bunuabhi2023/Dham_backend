const mongoose = require("mongoose");

const bookings = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:true,
        },
        serviceId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required:false,
        },
        bookingDate:{
            type:String,
            required:false,
        },
        bookingTime:{
            type:String,
            required:false,   
        },
        bookingHrs:{
            
            type:String,
            required:false,
        },
        bookingStatus:{
            type:String,
            enum:["pending", "accepted",  "rejected", "completed", "canceled"],
            default: "pending"

        },
        amount:{
            type:String,
            required:false,
        },  
        createdAt:{
            type:Date,
            required:true,
            default:Date.now(),
        },
        updatedAt:{
            type:Date,
            required:true,
            default:Date.now(),
        }
    }
);
module.exports = mongoose.model("Booking", bookings);