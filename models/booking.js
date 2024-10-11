const mongoose = require("mongoose");

const bookings = new mongoose.Schema(
    {
        hotelId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },
        roomId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HotelsRooms',
            required:true,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:false,
        },
        customerFirstName:{
            type:String,
            required:false,
            maxLength:255,
        },
        customerLastName:{
            type:String,
            required:false,
            maxLength:255,
        },
        email:{
            type:String,
            required:false,
            maxLength:255,
        },
        mobile:{
            type:String,
            required:true,
            maxLength:255,
        },
        state:{
            type:String,
            required:false,
            maxLength:255,
        },
        city:{
            type:String,
            required:false,
            maxLength:255,
        },
        pincode:{
            type:String,
            required:false,
            maxLength:255,
        },
        isGuest:{
            type:Boolean,
            default:false,
        },
        bookingDate:{
            type:String,
            required:false,
        },
        bookingTime:{
            type:String,
            required:false,   
        },
        checkInDate:{      
            type:Date,
            required:true,
        },
        checkOutDate:{      
            type:Date,
            required:true,
        },
        bookingStatus:{
            type:String,
            enum:["pending", "booked", "canceled"],
            default: "pending"

        },
        perDayPrice:{
            type:Number,
            required:true,
        },
        taxAmount:{
            type:Number,
            required:true,
        },
        totalPrice:{
            type:Number,
            required:true,
        },
        discountPrice:{
            type:Number,
            required:true,
            default:0
        },
        finalPrice:{
            type:Number,
            required:true,
        },
        paymentStatus:{
            type:String,
            enum:["pending", "paid", "canceled"],
            default: "pending"

        },  
        paymentMethod:{
            type:String,
            enum:["cash", "online"],
            default: "cash"

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
module.exports = mongoose.model("Booking", bookings);