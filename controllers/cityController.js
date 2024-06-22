const State = require('../models/state');
const City = require('../models/city');
const {catchError} = require('../middlewares/CatchError');

exports.createCity = catchError(async(req, res) =>{
    const {name, stateId} = req.body;
    const existingCity = await City.findOne({name:name,stateId:stateId });
    if(existingCity){
        return res.status(409).json({message:"Enterd City Name is already exist For Given State"});
    }

    const newCity = new City({name, stateId});
    const savedCity = await newCity.save();

    return res.status(200).json({city:savedCity});
});

exports.getAllCity = catchError(async(req, res)=>{
    const cities = await City.find().populate('stateId', 'name').exec();
    return res.status(200).json({cities:cities});
});

exports.getByState = catchError(async(req, res)=>{
    const {stateId} = req.params;
    const cities = await City.find({stateId:stateId}).populate('stateId', 'name').exec();
    return res.status(200).json({cities:cities});
});