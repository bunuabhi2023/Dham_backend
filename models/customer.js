const mongoose = require("mongoose");

const customers = new mongoose.Schema(
    {
        firstname:{
            type:String,
            required:true,
            maxLength:255,
        },
        lastname:{
            type:String,
            required:true,
            maxLength:255,
        },
        email: {
            type:String, trim: true,
            required:false,
            maxLength:255,
        },
        password: {
            type:String,
            required:false,
            maxLength:255,
        },
        email_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        mobile: {
            type:String, trim: true , unique:true,
            required:true,
            maxLength:50,
        },
        mobile_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        dob: {
            type:Date,
            required:false,
        }, 
        age: {
            type:Number,
            required:false,
        },
        latitude: {
            type:String,
            required:false,
            maxLength:255,
        },
        longitude: {
            type:String,
            required:false,
            maxLength:255,
        },
        mobile_verified_at: {
            type:Date,
            required:false,
        },
        email_verified_at: {
            type:Date,
            required:false,
        },
        status: {
            type:String,
            required:false,
            default: 'active',
        },
        file:{
            Bucket:{
                type:String,
                required:false,
                maxLength:255,
            },
            Key:{
                type:String,
                required:false,
                maxLength:255,
            },
            Url:{
                type:String,
                required:false,
                maxLength:255,
            }
        },
        favorites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        }],
        recentlyViewedHotels: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
        ],
        otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        deviceId:{
            type:String,
            required:false,
            maxLength:800,
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

module.exports = mongoose.model("Customer", customers);