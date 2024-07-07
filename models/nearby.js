
const mongoose = require("mongoose");

const nearbies = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,

        },
        description:{
            type:String,
            required:true,
            maxLength:1000,

        },
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required:true,
        },
        type:{
            type:String,
            enum:["top_sights", "restaurants", "comunication"],
            required:true,
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
        file:
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

            },
        
    },
    { timestamps: true,}
);
nearbies.index({ location: "2dsphere" });
module.exports = mongoose.model("NearBy", nearbies);