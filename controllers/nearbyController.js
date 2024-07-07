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