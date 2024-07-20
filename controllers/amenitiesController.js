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
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};
    
    if (req.query.name) {
        query.name = req.query.name; 
    }
    const amenities = await Amenity.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
    return res.status(200).json({
        data:amenities,
        currentPage: page,
        totalPages: Math.ceil(await Amenity.countDocuments(query) / pageSize),
        count: Math.ceil(await Amenity.countDocuments(query)),
    });
});

exports.getAmenitiesById = catchError(async(req, res) =>{
    const amenity = await Amenity.findById(req.params.id);

    return res.status(200).json({data:amenity});
});

exports.updateAmenity = catchError(async(req, res) =>{
    const {name} = req.body;
    const file = req.s3FileUrl;

    const duplicateHotel = await Amenity.findOne({
        $and: [
          { _id: { $ne: req.params.id } }, 
          {name:name}, 
        ],
      });
    
      if(duplicateHotel){
          return res.status(401).json({message:"Entered Amenity Name Already Exist!"});
      }

      const amenity = await Amenity.findById(req.params.id);

      amenity.name = name;
      amenity.file = file;
      amenity.save();

      return res.status(200).json({message:"Record Updated Successfully!"});
});

exports.deleteAmenity = catchError(async(req, res) => {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    return res.status(200).json({message:"Record Deleted Successfully!"});
})

