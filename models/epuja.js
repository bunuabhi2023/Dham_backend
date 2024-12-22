const mongoose = require("mongoose");

const epuja = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        ePujaDate:{
            type:Date,
            required:true
        },
        end_at:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true,
        },
        day:{
            type:String,
            required:false
        },

        price:{
            type:Number,
            required:true,
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
        stateId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: false,
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
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
module.exports = mongoose.model("EPuja", epuja);