const mongoose = require("mongoose");

const advertisements = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        description:{
            type:String,
            required:false,
            maxLength:1000,
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
        validFrom:{
            type:Date,
            required:true,
            default:null,

        },
        validUpto:{
            type:Date,
            required:true,
            default:null,

        },
        offerOnItem:{
            type:String,
            required:false,
            maxLength:255,
        },
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: false,
        },
        discountPercentage:{
            type:Number,
            required:false,
            default:null,
        },
        discountAmount:{
            type:Number,
            required:false,
            default:null,
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
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false,
        },
        updatedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false,
        },


    }
);

module.exports = mongoose.model("Advertisement", advertisements);