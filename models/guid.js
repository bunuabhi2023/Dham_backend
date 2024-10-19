const mongoose = require("mongoose");

const guids = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        email: {
            type:String,
            required:true,
            maxLength:255,
        },
        password: {
            type:String,
            required:true,
            maxLength:255,
        },
        email_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        mobile: {
            type:String,
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
        otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        location: {
            type: {
              type: String,
              enum: ["Point"],
              required: false,
            },
            coordinates: {
              type: [Number],
              required: false,
              validate: {
                validator: function (value) {
                  return Array.isArray(value) && value.length === 2 && isFinite(value[0]) && isFinite(value[1]);
                },
                message: "Invalid coordinates",
              },
            },
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
            enum:["inactive", "active", "rejected"],
            default:"active"
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
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: false,
        },
        pincode:{
            type:String,
            required:false,
            maxLength:50,
        },
        address:{
            type:String,
            required:false,
            maxLength:5000,
        },
        about:{
            type:String,
            required:false,
            maxLength:5000,
        },
        pricePerHour:{
            type:Number,
            required:false,
        },
        languages:[{
            name:{
                type:String,
                required:false,
                maxLength:255,
            },
            isKnow:{
                type:Boolean,
                default:true
            }
         }],
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
guids.index({ location: "2dsphere" });
module.exports = mongoose.model("Guid", guids);