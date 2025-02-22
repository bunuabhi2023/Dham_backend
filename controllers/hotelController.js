const User = require('../models/user');
const Country = require("../models/country");
const State = require("../models/state");
const NearBy = require("../models/nearby");
const Guid = require("../models/guid");
const City = require("../models/city");
const bcrypt = require('bcryptjs');
const {catchError} = require('../middlewares/CatchError');
const HotelsRooms = require('../models/hotelsRooms');

exports.createHotel = catchError(async(req, res) =>{
    const { name, email, mobile, password, countryId, stateId, cityId, pincode, address, location, price, offerPrice, amenitiesId, propertyTypeId, foodAndDiningId } = req.body;
    const files = req.s3FileUrls;


    const existingUser = await User.findOne({
        $or: [{ email }, { mobile }],
    });

    if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const latestHotel = await User.findOne({ hotelName: { $regex: /^Dham-\d+$/i } }).sort({ _id: -1 });

    let newHotelName;
    if (latestHotel) {
        const latestNumber = parseInt(latestHotel.hotelName.split('-')[1], 10);
        const newNumber = latestNumber + 1;
        newHotelName = `Dham-${newNumber}`;
    } else {
        newHotelName = 'Dham-1';
    }

    let parsedLocation;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid location format' });
      }
    } else {
      parsedLocation = location;
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
      price,
      offerPrice,
      amenitiesId,
      propertyTypeId,
      foodAndDiningId,
      location:parsedLocation,
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

  const { name, email, mobile,  countryId, stateId, cityId, pincode, address, location, price, offerPrice, amenitiesId, propertyTypeId, foodAndDiningId } = req.body;
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

  let parsedLocation;
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid location format' });
    }
  } else {
    parsedLocation = location;
  }

  hotel.name = name??hotel.name;
  hotel.email = email??hotel.email;
  hotel.mobile = mobile??hotel.mobile;
  hotel.countryId = countryId??hotel.countryId;
  hotel.stateId = stateId??hotel.stateId;
  hotel.cityId = cityId??hotel.cityId;
  hotel.pincode = pincode??hotel.pincode;
  hotel.address = address??hotel.address;
  hotel.files = files??hotel.files;
  hotel.location = parsedLocation??hotel.location;
  hotel.price = price??hotel.price; 
  hotel.offerPrice = offerPrice??hotel.offerPrice;
  hotel.amenitiesId = amenitiesId??hotel.amenitiesId;
  hotel.propertyTypeId = propertyTypeId??hotel.propertyTypeId;
  hotel.foodAndDiningId = foodAndDiningId??hotel.foodAndDiningId;
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
          { hotelName: searchRegex },
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
      .populate('propertyTypeId', 'name')
      .populate('foodAndDiningId', 'name')
      .populate('amenitiesId')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

      return res.status(200).json({
        hotels,
        currentPage: page,
        totalPages: Math.ceil(await User.countDocuments(query) / pageSize),
        count: Math.ceil(await User.countDocuments(query)),
      });
});


exports.getHotelsForUser = catchError(async(req, res) =>{

    let query = {};
    query.role = 'Hotel'
    if (req.query.search) {
      const searchValue = req.query.search.trim(); 
      const searchRegex = new RegExp(`^${searchValue}$`, 'i');

      console.log("Regex pattern:", searchRegex); 
      const city = await City.findOne({ name: searchRegex });

      if(city){
        query.cityId = city._id;
      }

      else{

        query.hotelName = searchRegex;
      }
  
  }

  if (req.query.hotelName) {
      query.hotelName = req.query.hotelName; 
  }

  if (req.query.cityId) {
      query.cityId = req.query.cityId; 
  }
  const users = await User.find(query).select('-password').populate('cityId', 'name').populate('amenitiesId');

  let nearbies = null;
  let guids = null;

  for (const user of users) {
      const cityId = user.cityId;

      nearbies = await NearBy.find({cityId:cityId});

      guids = await Guid.find({cityId:cityId});


  }

  const data = {
    'hotel': users,
    'nearBy': nearbies,
    'guid': guids
  }
  


  return res.status(200).json(data);

});

exports.getHotelById = catchError(async(req, res) =>{
    const hotel = await User.findById(req.params.id)
                        .populate('amenitiesId')
                        .populate('cityId', 'name')
                        .populate('countryId', 'name')
                        .populate('stateId', 'name')
                        .populate('propertyTypeId', 'name')
                        .populate('foodAndDiningId', 'name')
                        .exec();

  
    const hotelRooms = await HotelsRooms.find({userId:req.params.id}).populate('roomCategoryId', 'name').populate('amenitiesId', 'name').lean().exec();
    const cityId = hotel.cityId;
    const nearbies = await NearBy.find({cityId:cityId});
  
    const hotelCoords = hotel.location.coordinates;
  
    const nearbiesWithDistances = nearbies.map(nearby => {
        const nearbyCoords = nearby.location.coordinates;
        if (!Array.isArray(nearbyCoords) || nearbyCoords.length !== 2) {
            return {
                ...nearby.toObject(),
                distance: 'unknown'
            };
        }
  
        const distance = calculateDistance(hotelCoords, nearbyCoords).toFixed(2);
        return {
            ...nearby.toObject(),
            distance:  `${distance} km`
        };
    });

  return res.status(200).json({data:hotel,
    hotelRooms,
    nearbiesWithDistances});
})


exports.getAllHotels = catchError(async(req, res) => {    

  let query = {};
  query.role = 'Hotel'

  const hotels = await User.find(query)
  .select('_id hotelName') 
  .exec();

    return res.status(200).json({
      hotels
    });
});

exports.deleteHotel = catchError(async(req, res) =>{
  const deleteHotel = await User.findByIdAndDelete(req.params.id);

  return res.status(200).json({message:"Record Deleted Successfully!"});
});




exports.gethotelDetails = catchError(async(req, res) =>{
  const hotel = await User.findById(req.params.id)
                          .populate('amenitiesId')
                          .populate('cityId', 'name')
                          .populate('propertyTypeId', 'name')
                          .populate('foodAndDiningId', 'name')
                          .lean()
                          .exec();
  const hotelRooms = await HotelsRooms.find({userId:req.params.id}).populate('roomCategoryId', 'name').populate('amenitiesId', 'name').lean().exec();
  const cityId = hotel.cityId;
  const nearbies = await NearBy.find({cityId:cityId});

  hotel.id = hotel._id;
  delete hotel._id;
  const hotelCoords = hotel.location.coordinates;

  const updatedHotelRooms = hotelRooms.map(room => {
      room.id = room._id;
      delete room._id;
      return room;
  });

  const nearbiesWithDistances = nearbies.map(nearby => {
      const nearbyCoords = nearby.location.coordinates;
      if (!Array.isArray(nearbyCoords) || nearbyCoords.length !== 2) {
          return {
              ...nearby.toObject(),
              distance: 'unknown'
          };
      }

      const distance = calculateDistance(hotelCoords, nearbyCoords).toFixed(2);
      return {
          ...nearby.toObject(),
          distance:  `${distance} km`
      };
  });

  return res.status(200).json({
    hotel,
    hotelRooms:updatedHotelRooms,
    nearbiesWithDistances
  });
  
})




function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
}

function calculateDistance(coords1, coords2) {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
      0.5 - Math.cos(dLat) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon)) / 2;

  return R * 2 * Math.asin(Math.sqrt(a));
}


exports.getHotelByCity = catchError(async(req, res) =>{
 
  let {cityId,cityName, amenities, foodAndDinings, priceRange, min_price, max_price,page = 1, limit = 10 } = req.query;
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

  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    query.amenitiesId = { $all: amenitiesArray };
  }

  if (foodAndDinings) {
    const foodAndDiningsArray = Array.isArray(foodAndDinings) ? foodAndDinings : [foodAndDinings];
    query.foodAndDiningId = { $all: foodAndDiningsArray };
  }

  if (req.query.propertyTypeId) {
      query.propertyTypeId = req.query.propertyTypeId; 
  }

  if (priceRange) {
    const [minPrice, maxPrice] = priceRange.split(" to ").map(Number);
    query.offerPrice = { $gte: minPrice, $lte: maxPrice };
  } else if (min_price !== undefined && max_price !== undefined) {
    query.offerPrice = { $gte: Number(min_price), $lte: Number(max_price) };
  }else if(min_price !== undefined){
    query.offerPrice = { $gte: Number(min_price) };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Fetch hotels with pagination
  const hotels = await User.find(query)
    .populate('amenitiesId', 'name')
    .populate('propertyTypeId', 'name')
    .populate('foodAndDiningId', 'name')
    .select('-password')
    .skip(skip)
    .limit(limitNum)
    .exec();

  const updatedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      hotelObj.id = hotelObj._id;
      delete hotelObj._id;
      
      return hotelObj;
  });

  const count0To1500 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 0, $lte: 1500 }
  });

  // Count for 1500 to 3000
  const count1500To3000 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 1500, $lte: 3000 }
  });

  const count3000To5500 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 3000, $lte: 5500 }
  });

  const count5500To7500 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 5500, $lte: 7500 }
  });

  const count7500To11500 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 7500, $lte: 11500 }
  });

  const count11500To15000 = await User.countDocuments({
    cityId: cityId,
    offerPrice: { $gt: 11500, $lte: 15000 }
  });

  const totalPages = Math.ceil( updatedHotels.length / limitNum);
  // Construct the response
  return res.status(200).json({
    hotels: updatedHotels,
    count : updatedHotels.length,
    city : city.name??null,
    priceRangeCounts: {
      "0 to 1500": count0To1500,
      "1500 to 3000": count1500To3000,
      "3000 to 5500": count3000To5500,
      "5500 to 7500": count5500To7500,
      "7500 to 11500": count7500To11500,
      "11500 to 15000": count11500To15000
    },
    currentPage: pageNum,
    totalPages
  });

});

