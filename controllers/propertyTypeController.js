const PropertyType = require('../models/propertyType');
const {catchError} = require('../middlewares/CatchError');

exports.createPropertyType = catchError(async(req, res) =>{
    const {name} = req.body;
    const existingType = await PropertyType.findOne({name:name});
    if(existingType){
        return res.status(409).json({message:"Enterd  Property Type is already exist"});
    }

    const newPropertyType = new PropertyType({name});
    const savedPropertyType = await newPropertyType.save();

    return res.status(200).json({data:savedPropertyType});
});


exports.getAllPropertyType = catchError(async(req, res)=>{
    const propertyTypes = await PropertyType.find();

    const updatedPropertyType = propertyTypes.map(type => {
        const typeObj = type.toObject();
        typeObj.id = typeObj._id;
        delete typeObj._id;
        
        return typeObj;
    });
    return res.status(200).json({propertyType:updatedPropertyType});
});

exports.getPropertyTypeById = catchError(async(req, res) =>{
    const propertyType = await PropertyType.findById(req.params.id);
    return res.status(200).json({data:propertyType});
});

exports.updatePropertyType = catchError(async(req, res) =>{
    const propertyType = await PropertyType.findByIdAndUpdate( {_id:req.params.id},
    {name: req.body.name},
    {new:true});

    return res.status(200).json({data:propertyType});
});

exports.deletePropertyType = catchError(async(req, res) =>{
    const propertyType = await PropertyType.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});

});

