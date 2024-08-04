const User = require('../models/user');
const NearBy =  require('../models/nearby');
const Guid = require('../models/guid');
const {catchError} = require('../middlewares/CatchError');


exports.TopHotels = catchError(async(req, res) => {
    let query = {};
    query.role = 'Hotel'

  if (req.query.cityId) {
      query.cityId = req.query.cityId; 
  }
  const users = await User.find(query).select('-password').populate('cityId', 'name');

  return res.status(200).json({data:users});
});

exports.TopNearBy = catchError(async(req, res) =>{
    let query = {};

  if (req.query.cityId) {
      query.cityId = req.query.cityId; 
  }
  const nearbies = await NearBy.find(query).populate('cityId', 'name');

  return res.status(200).json({data:nearbies});
})