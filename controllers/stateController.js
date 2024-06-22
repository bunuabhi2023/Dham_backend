const State = require('../models/state');
const Country = require('../models/country');
const {catchError} = require('../middlewares/CatchError');

exports.createState = catchError(async(req, res) =>{
    const {name, countryId} = req.body;
    const existingState = await State.findOne({name:name});
    if(existingState){
        return res.status(409).json({message:"Enterd State Name is already exist"});
    }

    const newState = new State({name, countryId});
    const savedState = await newState.save();

    return res.status(200).json({state:savedState});
});

exports.getAllState = catchError(async(req, res)=>{
    const states = await State.find().populate('countryId', 'name').exec();
    return res.status(200).json({states:states});
});

exports.getByCountry = catchError(async(req, res)=>{
    const {countryId} = req.params;
    const states = await State.find({countryId:countryId}).populate('countryId', 'name').exec();
    return res.status(200).json({states:states});
});