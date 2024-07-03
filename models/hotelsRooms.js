
const mongoose = require("mongoose");

const hotelsrooms = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },
        roomCategoryId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomCategory',
            required:true,
        },
        amenitiesId:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Amenity',
            required:false,
        }],
        price:{
            type:Number,
            required:true
        },
        offerPrice:{
            type:Number,
            required:true
        },
        is_available:{
            type:Boolean,
            default:true
        },
        totalNoOfRooms:{
            type:Number,
            required:true
        },
        area:{
            type:String,
            required:true,
            maxLength:255,
        },
        floor:{
            type:String,
            required:true,
            maxLength:255,
        },
        bedSize:{     
            type:String,
            required:true,
            maxLength:255,
        },
        files:[
            {
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

            }
        ],
    },
    { timestamps: true,}
);

module.exports = mongoose.model("HotelsRooms", hotelsrooms);