const Country = require('../models/country');
const {catchError} = require('../middlewares/CatchError');

exports.saveCountry = catchError(async(req, res) =>{
    const {name} = req.body;

    const existingCountry = await Country.findOne({name});

    if(existingCountry){
        return res.status(401).json({message:"Country Name Already exist!"});
    }

    const newCountry = new Country({name:name});

    const savedCountry = await newCountry.save();
    return res.status(200).json({message:"Country Created Successfully!", data:savedCountry});
});

exports.getCountryBySuperAdmin = catchError(async(req, res) =>{
    const { search, page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const query = {};
    const countries = await Country.find().skip(skip).limit(pageSize).exec();
    console.log(countries);

    return res.status(200).json({
        countries,
        currentPage: page,
        totalPages: Math.ceil(await Country.countDocuments(query) / pageSize),
      });
});

exports.getCountry = catchError(async(req, res) =>{
    const countries = await Country.find();

    return res.status(200).json({data:countries});
});

exports.getCountryById = catchError(async(req, res) =>{
    const country = await Country.findById(req.params.id);
    return res.status(200).json({data:country});
});

exports.updateCountry = catchError(async(req, res) =>{
    const {name} = req.body;
    const existingCountry = await Country.findById(req.params.id);

    if (!existingCountry) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const duplicateCountry = await Country.findOne({
      $and: [
        { _id: { $ne: existingCountry._id } }, 
        {name:name}, 
      ],
    });

    if(duplicateCountry){
        return res.status(401).json({message:"Country Name Already exist!"});
    }

    const updatedCountry = await Country.findByIdAndUpdate(
        req.params.id,
        { name},
        { new: true }
      );
  
    res.status(200).json({user:updatedCountry});
});

exports.deleteCountry = catchError(async(req, res) =>{
    const deleteCountry = await Country.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});
})