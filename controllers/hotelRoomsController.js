const HotelsRooms = require('../models/hotelsRooms');
const {catchError} = require('../middlewares/CatchError');


exports.createRoomsByAdmin = catchError(async(req, res) =>{
    const {userId, roomCategoryId, amenitiesId, price, offerPrice, totalNoOfRooms, area, floor, bedSize} = req.body;

    const files = req.s3FileUrls;

    const newRoom = new HotelsRooms({
        userId,
        roomCategoryId,
        amenitiesId, 
        price,
        offerPrice,
        totalNoOfRooms,
        area,
        floor,
        bedSize,
        files
    });

    const savedRooms = await newRoom.save();

    return res.status(200).json({message:"Room Created Successfully!", data:savedRooms});


});

exports.createMyRooms = catchError(async(req, res) =>{
    const {roomCategoryId, amenitiesId, price, offerPrice, totalNoOfRooms, area, floor, bedSize} = req.body;

    const files = req.s3FileUrls;

    
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const newRoom = new HotelsRooms({
        userId,
        roomCategoryId,
        amenitiesId, 
        price,
        offerPrice,
        totalNoOfRooms,
        area,
        floor,
        bedSize,
        files
    });

    const savedRooms = await newRoom.save();

    return res.status(200).json({message:"Room Created Successfully!", data:savedRooms});


});

exports.getAllHotelsRooms = catchError(async(req, res) =>{   
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};

    
    if (req.query.userId) {
        query.userId = req.query.userId; 
    }
    if (req.query.roomCategoryId) {
        query.roomCategoryId = req.query.roomCategoryId; 
    }
    if (req.query.bedSize) {
        query.bedSize = req.query.bedSize; 
    }
    if (req.query.area) {
        query.area = req.query.area; 
    }

    const rooms = await HotelsRooms.find(query)
                    .populate('userId', 'name')
                    .populate('amenitiesId')
                    .populate('roomCategoryId', 'name')
                    .skip((page - 1) * pageSize)
                    .limit(pageSize)
                    .lean();

    return res.status(200).json({
        rooms,
        currentPage: page,
        totalPages: Math.ceil(await HotelsRooms.countDocuments(query) / pageSize),
        count: Math.ceil(await HotelsRooms.countDocuments(query)),
    });

});

exports.getAllMyHotelsRooms = catchError(async(req, res) =>{   
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};

    
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    
    query.userId = userId; 
  
    if (req.query.roomCategoryId) {
        query.roomCategoryId = req.query.roomCategoryId; 
    }
    if (req.query.bedSize) {
        query.bedSize = req.query.bedSize; 
    }
    if (req.query.area) {
        query.area = req.query.area; 
    }

    const rooms = await HotelsRooms.find(query)
                    .populate('userId', 'name')
                    .populate('amenitiesId')
                    .populate('roomCategoryId', 'name')
                    .skip((page - 1) * pageSize)
                    .limit(pageSize)
                    .lean();

    return res.status(200).json({
        rooms,
        currentPage: page,
        totalPages: Math.ceil(await HotelsRooms.countDocuments(query) / pageSize),
        count: Math.ceil(await HotelsRooms.countDocuments(query)),
    });

});


exports.getRoomsById = catchError(async(req, res) =>{
    const room = await HotelsRooms.findById(req.params.id)
    .populate('userId', 'name')
    .populate('cityId', 'name')
    .populate('amenitiesId')
    .populate('roomCategoryId', 'name').exec();
    res.status(200).json({data:room});
});
exports.getRoomsByHotel = catchError(async(req, res) =>{
    const rooms = await HotelsRooms.find({userId:req.params.id})
    .populate('userId', 'name')
    .populate('cityId', 'name')
    .populate('amenitiesId')
    .populate('roomCategoryId', 'name').exec();

    const updatedRooms = rooms.map(room => {
        const roomObj = room.toObject();
        roomObj.id = roomObj._id;
        delete roomObj._id;
        
        return roomObj;
    });
    res.status(200).json({data:updatedRooms});
});

exports.updateHotelRoom = catchError(async(req, res) =>{
    console.log('Request body:', req.body); // Log received data

    const {
      roomCategoryId,
      amenitiesId,
      price,
      offerPrice,
      totalNoOfRooms,
      area,
      floor,
      bedSize,
    } = req.body;
    const files = req.s3FileUrls;

    const room = await HotelsRooms.findById(req.params.id);

    room.roomCategoryId = roomCategoryId;
    room.amenitiesId = amenitiesId;
    room.price = price;
    room.offerPrice = offerPrice;
    room.totalNoOfRooms= totalNoOfRooms;
    room.area = area;
    room.floor = floor;
    room.bedSize = bedSize;
    room.files = files;
   await room.save();
    return res.status(200).json({message:"Room updated Successfully!", data:room});
});

exports.deleteHotelRoom = catchError(async(req, res) =>{
    const deleteHotelRoom = await HotelsRooms.findByIdAndDelete(req.params.id);
  
    return res.status(200).json({message:"Record Deleted Successfully!"});

})