
const mongoose = require("mongoose");

const cities = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true,
            maxLength:255,
        },
        stateId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: false,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("City", cities);