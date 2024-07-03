const State = require('../models/state');
const Country = require('../models/country');
const {catchError} = require('../middlewares/CatchError');

exports.createState = catchError(async(req, res) =>{
    const {name, countryId} = req.body;
    const existingState = await State.findOne({name:name});
    if(existingState){
        return res.status(409).json({message:"Enterd State Name is already exist"});
    }

    const newState = new State({name, countryId});
    const savedState = await newState.save();

    return res.status(200).json({state:savedState});
});

exports.getAllState = catchError(async(req, res)=>{
    const states = await State.find().populate('countryId', 'name').exec();
    return res.status(200).json({states:states});
});



exports.getStateBySuperAdmin = catchError(async(req, res) =>{
    const { search, page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const query = {};
    
    if (req.query.countryId) {
        query.countryId = req.query.countryId; 
    }
    if (req.query.name) {
        query.name = { $regex:req.query.name, $options: 'i' };
    }
    const states = await State.find(query).populate('countryId', 'name').skip(skip).limit(pageSize).exec();
  

    return res.status(200).json({
        states,
        currentPage: page,
        totalPages: Math.ceil(await State.countDocuments(query) / pageSize),
      });
});

exports.getByCountry = catchError(async(req, res)=>{
    const {countryId} = req.params;
    const states = await State.find({countryId:countryId}).populate('countryId', 'name').exec();
    return res.status(200).json({states:states});
});

exports.updateSate = catchError(async(req, res) =>{
    
    const{name, countryId} = req.body;

    const existingState = await State.findById(req.params.id);

    if (!existingState) {
      return res.status(404).json({ error: 'State not found' });
    }

    
    const duplicateState = await State.findOne({
      $and: [
        { _id: { $ne: existingState._id } }, 
        {name:name, countryId:countryId}, 
      ],
    });

    if(duplicateState){
        return res.status(401).json({message:"State Name Already exist!"});
    }

    
    const updatedState = await State.findByIdAndUpdate(
        req.params.id,
        {name, countryId},
        { new: true }
      );
  
    res.status(200).json({state:updatedState});

});

exports.deleteState = catchError(async(req, res) =>{
    const deleteState = await State.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});

})