
const mongoose = require("mongoose");

const amenities = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true,
            maxLength:255,
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
    },
    { timestamps: true,}
);

module.exports = mongoose.model("Amenity", amenities);