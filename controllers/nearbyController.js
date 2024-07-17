const NearBy = require('../models/nearby');
const {catchError} = require('../middlewares/CatchError');

exports.createNearBy = catchError(async(req, res) =>{
    const {name, description, cityId, type, location } = req.body;

    const file = req.s3FileUrl;
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

    const nearby = new NearBy({
        name,
        description,
        cityId,
        type,
        location:parsedLocation,
        file
    });

    const savedNearBy = await nearby.save();

    return res.status(201).json({message:"New Place Created Successfully!", data:savedNearBy});
});

exports.updateNearBy = catchError(async(req, res) =>{
  const {name, description, cityId, type, location } = req.body;

  const file = req.s3FileUrl;
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

  const duplicatePlace = await NearBy.findOne({
    $and: [
      { _id: { $ne: req.params.id } }, 
      {name:name, cityId:cityId}, 
    ],
  });

  if(duplicatePlace){
      return res.status(401).json({message:"Entered Place Name for the Entered City Already Exist!"});
  }

  const place = await NearBy.findById(req.params.id);

  place.name = name;
  place.description = description;
  place.cityId = cityId;
  place.type = type;
  place.location = parsedLocation;
  place.file = file;
  place.save();

  return res.status(200).json({message:"Record Updated Successfully!"});
});

exports.getAllNearBy = catchError(async(req, res) =>{
  const {search, page =1, pageSize = 10} = req.query;
  
  const skip = (page - 1) * pageSize;
  const query = {};
  
  if (req.query.cityId) {
      query.cityId = req.query.cityId; 
  }
  if (req.query.name) {
      query.name = { $regex:req.query.name, $options: 'i' };
  }
  if (req.query.type) {
      query.type = { $regex:req.query.type, $options: 'i' };
  }

  const nearbies = await NearBy.find(query).populate('cityId', 'name').skip(skip).limit(pageSize).exec();


  return res.status(200).json({
      nearbies,
      currentPage: page,
      totalPages: Math.ceil(await NearBy.countDocuments(query) / pageSize),
      count: Math.ceil(await NearBy.countDocuments(query))
    });

});