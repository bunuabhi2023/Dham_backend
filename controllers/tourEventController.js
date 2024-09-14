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

exports.updateTourEvent = catchError(async (req, res) => {
  const { id } = req.params;
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

  const updatedFields = {
    title,
    description,
    start_from,
    end_at,
    departure_date,
    departure_time,
    cost,
    duration,
    plans: parsedPlans,
    type,
    departure_from,
    cityId,
    createdBy: userId,
    files,
  };

  try {
    const updatedTourEvent = await TourEvent.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedTourEvent) {
      return res.status(404).json({ message: 'Tour/Event not found' });
    }

    return res.status(200).json({ message: 'Record Updated Successfully', data: updatedTourEvent });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating Tour/Event', error });
  }
});


exports.currentCityTour = catchError(async(req, res) =>{
  const currentDate = new Date();

  const getCurrentCityTours = await TourEvent.find({
    cityId: "66768a2ade79539f7cbb10b1",
    type: "tour",
    end_at: { $gt: currentDate } 
  }).lean().exec();
  const CityTours = getCurrentCityTours.map(cityTour => {
    cityTour.id = cityTour._id;
      delete cityTour._id;
      return cityTour;
  });

  return res.status(200).json({CityTours});
});

exports.upComingTourEvent = catchError(async(req, res) =>{
  const currentDate = new Date();

  const getUpcommingToursEvents = await TourEvent.find({
    start_from: { $gt: currentDate } 
  }).lean().exec();
  const EventTours = getUpcommingToursEvents.map(eventTour => {
    eventTour.id = eventTour._id;
      delete eventTour._id;
      return eventTour;
  });

  return res.status(200).json({upcommingToursAndEvent:EventTours});
});

exports.topDestination = catchError(async(req, res) =>{
  const currentDate = new Date();

  const getTopDestinations = await TourEvent.find({
    type: "tour",
    end_at: { $gt: currentDate } 
  }).lean().exec();
  const TopDestinations = getTopDestinations.map(topDestination => {
    topDestination.id = topDestination._id;
      delete topDestination._id;
      return topDestination;
  });

  return res.status(200).json({TopDestinations});
});


exports.getAllEventsAndTours = catchError(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = {};

  if (req.query.search) {
    const searchTerm = req.query.search;

    // Check if the search term is a valid date or number
    const isValidDate = !isNaN(Date.parse(searchTerm));
    const isValidNumber = !isNaN(Number(searchTerm));

    // Build the query with the search term
    query = {
      ...query,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } }, 
        isValidDate ? { start_from: new Date(searchTerm) } : {},  
        isValidDate ? { end_at: new Date(searchTerm) } : {},
        isValidDate ? { departure_date: new Date(searchTerm) } : {},
        { departure_time: { $regex: searchTerm, $options: 'i' } },
        isValidNumber ? { cost: Number(searchTerm) } : {},  
        isValidNumber ?  { duration: Number(searchTerm) }:{},
        { departure_from: { $regex: searchTerm, $options: 'i' } },
        { 'cityId.name': { $regex: searchTerm, $options: 'i' } },
      ].filter(condition => Object.keys(condition).length > 0),  
    };
  }

  const allEventsTours = await TourEvent.find(query)
    .skip(skip)
    .limit(pageSize)
    .populate('cityId', 'name')
    .exec();

  const totalDocuments = await TourEvent.countDocuments(query);

  return res.status(200).json({
    allEventsTours,
    currentPage: page,
    totalPages: Math.ceil(totalDocuments / pageSize),
  });
});


exports.getTourAndEventById = catchError(async(req, res) =>{
  const tourAndEvent = await TourEvent.findById(req.params.id).exec();

  tourAndEvent.id = tourAndEvent._id;
  delete tourAndEvent._id;


  return res.status(200).json({tourAndEvent});
});

exports.deleteTourEvent = catchError(async(req, res) =>{
  const deleteTourEvent = await TourEvent.findByIdAndDelete(req.params.id);

  return res.status(200).json({message:"Record Deleted Successfully!"});

});

