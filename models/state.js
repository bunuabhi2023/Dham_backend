
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
    },
    { timestamps: true,}
);

module.exports = mongoose.model("State", states);