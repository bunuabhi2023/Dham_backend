
const mongoose = require("mongoose");

const countries = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true,
            maxLength:255,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("Country", countries);