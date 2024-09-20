const FoodDining = require('../models/FoodAndDining');
const {catchError} = require('../middlewares/CatchError');

exports.createFoodAndDining = catchError(async(req, res) =>{
    const {name} = req.body;
    const existingFoodAndDining = await FoodDining.findOne({name:name});
    if(existingFoodAndDining){
        return res.status(409).json({message:"Enterd Food And Dining is already exist."});
    }
    
    const newFoodAndDining = new FoodDining({name, file});
    const savedFoodAndDining = await newFoodAndDining.save();

    return res.status(200).json({FoodDining:savedFoodAndDining});

});

exports.getFoodAndDining = catchError(async(req, res) =>{
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};
    
    if (req.query.name) {
        query.name = req.query.name; 
    }
    const foodAndDining = await FoodDining.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
    return res.status(200).json({
        data:foodAndDining,
        currentPage: page,
        totalPages: Math.ceil(await FoodDining.countDocuments(query) / pageSize),
        count: Math.ceil(await FoodDining.countDocuments(query)),
    });
});

exports.getFoodDiningById = catchError(async(req, res) =>{
    const foodDining = await FoodDining.findById(req.params.id);

    return res.status(200).json({data:foodDining});
});

exports.updateFoodDiningById = catchError(async(req, res) =>{
    const {name} = req.body;

    const duplicateFoodDining = await FoodDining.findOne({
        $and: [
          { _id: { $ne: req.params.id } }, 
          {name:name}, 
        ],
      });
    
      if(duplicateFoodDining){
          return res.status(401).json({message:"Entered Food Or Dining Name Already Exist!"});
      }

      const foodDining = await FoodDining.findById(req.params.id);

      foodDining.name = name;
      foodDining.save();

      return res.status(200).json({message:"Record Updated Successfully!"});
});

exports.deleteFoodDining = catchError(async(req, res) => {
    const foodDining = await FoodDining.findByIdAndDelete(req.params.id);
    return res.status(200).json({message:"Record Deleted Successfully!"});
});

exports.getAllFoodDining = catchError(async(req, res)=>{
    const foodAndDinings = await FoodDining.find();

    const updatedFoodDinings = foodAndDinings.map(foodDining => {
        const foodDiningObj = foodDining.toObject();
        foodDiningObj.id = foodDiningObj._id;
        delete foodDiningObj._id;
        
        return foodDiningObj;
    });
    return res.status(200).json({foodDinings:updatedFoodDinings});
});

