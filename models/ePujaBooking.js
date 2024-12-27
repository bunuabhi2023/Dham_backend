const mongoose = require("mongoose");

const epujabookings = new mongoose.Schema(
    {
        ePujaId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EPuja',
            required:true,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:false,
        },
        firstName:{
            type:String,
            required:true,
        },
        lastName:{
            type:String,
            required:true,   
        },
        gotra:{
            type:String,
            required:false,   
        },
        note:{
            type:String,
            required:false,   
        },
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: false,
        },
        bookingDate:{
            type:String,
            required:true,   
        },
        bookingStatus:{
            type:String,
            enum:["pending", "booked", "canceled"],
            default: "pending"

        },
        price:{
            type:Number,
            required:true,
        },
        paymentStatus:{
            type:String,
            enum:["pending", "paid", "partial_paid", "canceled"],
            default: "pending"

        },  
        paymentMethod:{
            type:String,
            enum:["cash", "online"],
            default: "online"

        }, 
        cancelReason:{
            type:String,
            required:false,   
        },
        isPartialPay:{
            type:Boolean,
            default:false,
        },
        paidAmount:{
            type:Number,
            required:false,
        }, 
        dueAmount:{
            type:Number,
            required:false,
        },
        paymentDate:{      
            type:Date,
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
module.exports = mongoose.model("EPujaBooking", epujabookings);