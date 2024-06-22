const mongoose = require("mongoose");

const faqs = new mongoose.Schema(
    {
        question:{
            type:String,
            required:true,
            maxLength:255,
        },
        answer:{
            type:String,
            required:true,
            maxLength:255,
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

module.exports = mongoose.model("Faq", faqs);