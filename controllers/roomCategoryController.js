const RoomCategory = require('../models/roomCategory');
const {catchError} = require('../middlewares/CatchError');

exports.createRoomCategory = catchError(async(req, res) =>{
    const {name} = req.body;
    const existingCategory = await RoomCategory.findOne({name:name});
    if(existingCategory){
        return res.status(409).json({message:"Enterd Room Category Name is already exist"});
    }

    const newRoomCategory = new RoomCategory({name});
    const savedRoomCategory = await newRoomCategory.save();

    return res.status(200).json({data:savedRoomCategory});
});


exports.getAllRoomCategory = catchError(async(req, res)=>{
    const roomcategories = await RoomCategory.find();
    return res.status(200).json({categories:roomcategories});
});

exports.getRoomCategoryById = catchError(async(req, res) =>{
    const roomCategory = await RoomCategory.findById(req.params.id);
    return res.status(200).json({data:roomCategory});
});

exports.updateRoomCategory = catchError(async(req, res) =>{
    const roomCategory = await RoomCategory.findByIdAndUpdate( {_id:req.params.id},
    {name: req.body.name},
    {new:true});

    return res.status(200).json({data:roomCategory});
});

exports.deleteRoomCategory = catchError(async(req, res) =>{
    const roomCategory = await RoomCategory.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});

})

