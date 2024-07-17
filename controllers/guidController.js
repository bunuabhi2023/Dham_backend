const Guid = require('../models/guid');
const bcrypt = require('bcryptjs');
const {catchError} = require('../middlewares/CatchError');

exports.createGuid = catchError(async(req, res) =>{
    const { name, email, mobile, password,  cityId, pincode, address, location } = req.body;
    const file = req.s3FileUrl;
    const existingUser = await Guid.findOne({
        $or: [{ email }, { mobile }],
    });

    if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newGuid = new Guid({
      name,
      email,
      mobile,
      password: hashedPassword,
      cityId,
      pincode,
      address,
      location,
      file
    });

   
    
    await newGuid.save();
    return res.status(201).json({ message: 'New Guid created successfully' });

    
});


exports.getGuidByCity = catchError(async(req, res) =>{
    const guids = await Guid.find({cityId:req.params.cityId}).populate('cityId', 'name').exec();

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

    const guids = await Guid.find(query).populate('cityId', 'name').skip(skip).limit(pageSize).exec();
  

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
  
    const { name, email, mobile, cityId, pincode, address } = req.body;
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
  
    guid.name = name;
    guid.email = email;
    guid.mobile = mobile;
    guid.cityId = cityId;
    guid.pincode = pincode;
    guid.address = address;
    guid.file = file;
    guid.save();
  
    res.status(201).json({message:"Guid Updated Successfully"});
});

exports.deleteGuid = catchError(async(req, res) =>{

    const deleteGuid = await Guid.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfuly!"});
})