const mongoose = require("mongoose");

const blogs = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        shotNote:{
            type:String,
            required:true,
            maxLength:255,
        },
        content:{
            type:String,
            required:true,
        },
        status: {
            type:String,
            enum:["draft", "published"],
            default:"draft"
        },
        files:[{
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
        }],
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: false,
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        tags:[{
            type:String,
            required:false,
            maxLength:255,
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
module.exports = mongoose.model("Blog", blogs);