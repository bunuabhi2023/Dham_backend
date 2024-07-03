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
    });

});
