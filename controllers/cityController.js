const User = require('../models/user');
const City = require('../models/city');
const {catchError} = require('../middlewares/CatchError');

exports.createCity = catchError(async(req, res) =>{
    const {name, stateId} = req.body;
    
    const file = req.s3FileUrl;
    const existingCity = await City.findOne({name:name,stateId:stateId });
    if(existingCity){
        return res.status(409).json({message:"Enterd City Name is already exist For Given State"});
    }

    const newCity = new City({name, stateId, file});
    const savedCity = await newCity.save();

    return res.status(200).json({city:savedCity});
});

exports.getAllCity = catchError(async(req, res)=>{
    const cities = await City.find().populate('stateId', 'name').exec();

    const updatedCities = await Promise.all(cities.map(async (city) => {
        const userCount = await User.countDocuments({ cityId: city._id }).exec();
      
        const cityWithUserCount = city.toObject();
        cityWithUserCount.propertyCount = userCount;
        cityWithUserCount.id = cityWithUserCount._id;
        delete cityWithUserCount._id;
        return cityWithUserCount;
    }));

    return res.status(200).json({ cities: updatedCities });
});

exports.getByState = catchError(async(req, res)=>{
    const {stateId} = req.params;
    const cities = await City.find({stateId:stateId}).populate('stateId', 'name').exec();
    return res.status(200).json({cities:cities});
});


exports.getCityBySuperAdmin = catchError(async(req, res) =>{
    const { search, page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const query = {};
    
    if (req.query.stateId) {
        query.stateId = req.query.stateId; 
    }
    if (req.query.name) {
        query.name = { $regex:req.query.name, $options: 'i' };
    }
    const cities = await City.find(query).populate('stateId', 'name').skip(skip).limit(pageSize).exec();
  

    return res.status(200).json({
        cities,
        currentPage: page,
        totalPages: Math.ceil(await City.countDocuments(query) / pageSize),
        count: Math.ceil(await City.countDocuments(query))
      });
});

exports.updateCity = catchError(async(req, res ) => {
    const {name, stateId} = req.body;

    const file = req.s3FileUrl;
    const existingCity = await City.findOne({name:name,stateId:stateId,  _id: { $ne: req.params.id } });
    if(existingCity){
        return res.status(409).json({message:"Enterd City Name is already exist For Given State"});
    }

    const city = await City.findById(req.params.id);
    city.name = name??city.name;
    city.stateId = stateId??city.stateId;
    city.file = file??city.file;
    city.save();

    return res.status(200).json({message:"City Updated Successfully!", data:city});

});

exports.deleteCity = catchError(async(req, res) =>{
    const deleteCity = await City.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});
})