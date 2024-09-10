const mongoose = require("mongoose");

const toursevents = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        start_from:{
            type:Date,
            required:true
        },
        end_at:{
            type:Date,
            required:true
        },
        description:{
            type:String,
            required:true,
        },
        departure_date:{
            type:Date,
            required:true
        },
        departure_time:{
            type:String,
            required:true
        },
        cost:{
            type:Number,
            required:true,
        },
        duration:{
            type:Number,
            required:true,
        },
        plans:[
           { day:{
                type:String,
                required:false,
                maxLength:255,
            },
            destination:{
                type:String,
                required:false,
                maxLength:255,
            },
            description:{
                type:String,
                required:false,
                maxLength:255,
            },}
        ],
        type: {
            type:String,
            enum:["tour", "event"],
            default:"tour"
        },
        departure_from:{
            type:String,
            required:false,
            maxLength:255,
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
module.exports = mongoose.model("TourEvent", toursevents);