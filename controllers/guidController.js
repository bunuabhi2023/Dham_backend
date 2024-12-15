const Guid = require('../models/guid');
const City = require('../models/city');
const bcrypt = require('bcryptjs');
const {catchError} = require('../middlewares/CatchError');

exports.createGuid = catchError(async(req, res) =>{
    const { name, email, mobile, password,  cityId, pincode, address, location, pricePerHour, languages, about } = req.body;
    const file = req.s3FileUrl;
    const existingUser = await Guid.findOne({
        $or: [{ email }, { mobile }],
    });

    if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let parsedLanguages;
    try {
        parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid languages format' });
    }

    const newGuid = new Guid({
      name,
      email,
      mobile,
      password: hashedPassword,
      cityId,
      pincode,
      address,
      location, 
      pricePerHour, 
      languages:parsedLanguages,
      about,
      file
    });

   
    
    await newGuid.save();
    return res.status(201).json({ message: 'New Guid created successfully' });

    
});


exports.getGuidByCity = catchError(async(req, res) =>{

     let {cityId,cityName, page = 1, limit = 10 } = req.query;
      let query = {};
      let city;
    
      if (cityId) {
        city = await City.findById(cityId).exec();
        if (city) {
          query.cityId = cityId; // Add cityId to query only if it exists
        }
      } else if (cityName) {
        // Find the city using a case-insensitive search for the cityName
        city = await City.findOne({ name: { $regex: cityName, $options: 'i' } }).exec();
        if (city) {
          query.cityId = city._id; // Add cityId from the found city by name
          cityId = city._id;
        }
      }else{
        return res.status(404).json({ message: "City not found" });
      }

    const guids = await Guid.find(query).populate('cityId', 'name').exec();

    return res.status(200).json({data:guids});
});

exports.getAllGuids = catchError(async(req, res) =>{
    const {search, page =1, pageSize = 10} = req.query;
    
    const skip = (page - 1) * pageSize;
    const query = {};
    
    if (req.query.cityId) {
        query.cityId = req.query.cityId; 
    }
    if (req.query.name) {
        query.name = { $regex:req.query.name, $options: 'i' };
    }

    const guids = await Guid.find(query).populate('cityId', 'name').select('-password').skip(skip).limit(pageSize).exec();
  

    return res.status(200).json({
        guids,
        currentPage: page,
        totalPages: Math.ceil(await Guid.countDocuments(query) / pageSize),
        count: Math.ceil(await Guid.countDocuments(query))
      });

});

exports.editGuid = catchError(async(req, res) =>{
    const guid = await Guid.findById(req.params.id);

    if(!guid){
      res.status(404).json({message:"Guid Not Found."});
    }
  
    const { name, email, mobile, cityId, pincode, address,  pricePerHour, languages, about } = req.body;
    const file = req.s3FileUrl;
     
    const duplicateGuid = await Guid.findOne({
      $and: [
        { _id: { $ne: req.params.id } }, 
        {email:email, mobile:mobile}, 
      ],
    });
  
    if(duplicateGuid){
        return res.status(401).json({message:"Entered Email or Mobile Already Exist For Other Guid!"});
    }

    
    let parsedLanguages;
    try {
        parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid languages format' });
    }
  
    guid.name = name??guid.name;
    guid.email = email??guid.email;
    guid.mobile = mobile??guid.mobile;
    guid.cityId = cityId??guid.cityId;
    guid.pincode = pincode??guid.pincode;
    guid.address = address??guid.address;
    guid.pricePerHour = pricePerHour??guid.pricePerHour;
    guid.languages = languages?parsedLanguages:guid.languages;
    guid.file = file??guid.file;
    guid.about = about??guid.about;
    guid.save();
  
    res.status(201).json({message:"Guid Updated Successfully"});
});

exports.deleteGuid = catchError(async(req, res) =>{

    const deleteGuid = await Guid.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfuly!"});
});

exports.getGuides = catchError(async(req, res) =>{
    const guids = await Guid.find().populate('cityId', 'name').select('-password').lean().exec();
    const ratings = [3.5, 4, 4.5]; // Predefined ratings
    const updatedGuids = guids.map(guid => {
        const guidObj = guid.toObject ? guid.toObject() : guid; // Ensure we can access as an object
        guidObj.id = guidObj._id;
        delete guidObj._id;

        // Add a random rating from the predefined set
        guidObj.rating = ratings[Math.floor(Math.random() * ratings.length)];

        return guidObj;
    });

    return res.status(200).json({ data: updatedGuids });
});

exports.getGuideById = catchError(async(req, res) =>{
    const guide = await Guid.findById(req.params.id).populate('cityId', 'name').select('-password').lean().exec();

    guide.id = guide._id;
    delete guide._id;
    guide.rating = 4.5;

    return res.status(200).json({guide});

})