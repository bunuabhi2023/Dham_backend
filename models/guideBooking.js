const mongoose = require("mongoose");

const guidebookings = new mongoose.Schema(
    {
        guideId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guid',
            required:true,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:false,
        },
        bookingDate:{
            type:String,
            required:false,
        },
        bookingTimeFrom:{
            type:String,
            required:false,   
        },
        bookingTimeTo:{
            type:String,
            required:false,   
        },
        totalBookingHours:{      
            type:Number,
            required:true,
        },
        bookingStatus:{
            type:String,
            enum:["pending", "booked", "canceled"],
            default: "pending"

        },
        perHourPrice:{
            type:Number,
            required:true,
        },
        taxAmount:{
            type:Number,
            required:true,
        },
        discountPrice:{
            type:Number,
            required:true,
            default:0
        },
        totalPrice:{
            type:Number,
            required:true,
        },
        guideIncome:{
            type:Number,
            required:true,
        },
        totalCommission:{
            type:Number,
            required:false,
        },
        paymentStatus:{
            type:String,
            enum:["pending", "paid", "partial_paid", "canceled"],
            default: "pending"

        },  
        paymentMethod:{
            type:String,
            enum:["cash", "online"],
            default: "cash"

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
module.exports = mongoose.model("GuideBooking", guidebookings);