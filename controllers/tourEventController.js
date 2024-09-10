const TourEvent = require("../models/tourEvent");
const { catchError } = require("../middlewares/CatchError");

exports.createTourEvent = catchError(async (req, res) => {
  const {
    title,
    description,
    start_from,
    end_at,
    departure_date,
    departure_time,
    cost,
    duration,
    plans,
    type,
    departure_from,
    cityId,
  } = req.body;

  const authenticatedUser = req.user;

  const userId = authenticatedUser._id;

  const files = req.s3FileUrls;

  let parsedPlans;
  try {
    parsedPlans = typeof plans === 'string' ? JSON.parse(plans) : plans;
  } catch (error) {
    return res.status(400).json({ message: 'Invalid plans format' });
  }

  const newTourEvent = new TourEvent({
    title,
    description,
    start_from,
    end_at,
    departure_date,
    departure_time,
    cost,
    duration,
    plans:parsedPlans,
    type,
    departure_from,
    cityId,
    createdBy:userId,
    files,

  });

  const savedTourEvent = await newTourEvent.save();

  return res.status(200).json({message:"Record Created Successfully"});

});
