
const mongoose = require("mongoose");

const states = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true,
            maxLength:255,
        },
        countryId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: false,
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

module.exports = mongoose.model("State", states);