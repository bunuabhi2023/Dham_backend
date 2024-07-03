const Amenity = require('../models/amenities');
const {catchError} = require('../middlewares/CatchError');

exports.createAmenity = catchError(async(req, res) =>{
    const {name} = req.body;
    const file = req.s3FileUrl;
    const existingAmenity = await Amenity.findOne({name:name});
    if(existingAmenity){
        return res.status(409).json({message:"Enterd Amenity is already exist."});
    }
    
    const newAmenity = new Amenity({name, file});
    const savedAmenity = await newAmenity.save();

    return res.status(200).json({amenity:savedAmenity});

});

exports.getAmenities = catchError(async(req, res) =>{
    const amenities = await Amenity.find();
    return res.status(200).json({data:amenities});
})

