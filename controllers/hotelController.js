const User = require('../models/user');
const Country = require("../models/country");
const State = require("../models/state");
const City = require("../models/city");
const bcrypt = require('bcryptjs');
const {catchError} = require('../middlewares/CatchError');

exports.createHotel = catchError(async(req, res) =>{
    const { name, email, mobile, password, countryId, stateId, cityId, pincode, address, location } = req.body;
    const files = req.s3FileUrls;
    const existingUser = await User.findOne({
        $or: [{ email }, { mobile }],
    });

    if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const latestHotel = await User.findOne({ hotelName: { $regex: /^Dham-\d+$/i } }).sort({ hotelName: -1 });

    let newHotelName;
    if (latestHotel) {
        const latestNumber = parseInt(latestHotel.hotelName.split('-')[1], 10);
        const newNumber = latestNumber + 1;
        newHotelName = `Dham-${newNumber}`;
    } else {
        newHotelName = 'Dham-1';
    }

    const newHotel = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      countryId,
      stateId,
      cityId,
      pincode,
      address,
      hotelName: newHotelName,
      location,
      files
    });

   
    
    await newHotel.save();
    return res.status(201).json({ message: 'New Hotel created successfully' });

    
});

exports.updateHotel = catchError(async(req, res) =>{
  const hotel = await User.findById(req.params.id);

  if(!hotel){
    res.status(404).json({message:"Hotel Not Found."});
  }

  const { name, email, mobile,  countryId, stateId, cityId, pincode, address } = req.body;
  const files = req.s3FileUrls;
   
  const duplicateHotel = await User.findOne({
    $and: [
      { _id: { $ne: req.params.id } }, 
      {email:email, mobile:mobile}, 
    ],
  });

  if(duplicateHotel){
      return res.status(401).json({message:"Entered Email or Mobile Already Exist FOr Other User!"});
  }

  hotel.name = name;
  hotel.email = email;
  hotel.mobile = mobile;
  hotel.countryId = countryId;
  hotel.stateId = stateId;
  hotel.cityId = cityId;
  hotel.pincode = pincode;
  hotel.address = address;
  hotel.files = files;
  hotel.save();

  res.status(201).json({message:"Hotel Updated Successfully"});

});

exports.getMyHotels = catchError(async(req, res) => {    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};
    query.role = 'Hotel'
    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search), 'gi');
      query = {
        ...query,
        $or: [
          { name: searchRegex },
          { mobile: searchRegex },
          { email: searchRegex },
        ],
      };
    }

    if (req.query.countryId) {
        query.countryId = req.query.countryId; 
    }
    if (req.query.stateId) {
        query.stateId = req.query.stateId; 
    }
    if (req.query.cityId) {
        query.cityId = req.query.cityId; 
    }

    const hotels = await User.find(query)
      .select('-password')
      .populate('countryId', 'name')
      .populate('stateId', 'name')
      .populate('cityId', 'name')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

      return res.status(200).json({
        hotels,
        currentPage: page,
        totalPages: Math.ceil(await User.countDocuments(query) / pageSize),
      });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

