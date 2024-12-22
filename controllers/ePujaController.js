const EPuja = require('../models/epuja');
const {catchError} = require('../middlewares/CatchError');

exports.createEPuja = catchError(async(req, res) =>{
    const {title,ePujaDate,end_at,description,day,price,cityId,stateId} = req.body;
    console.log(title);
      const authenticatedUser = req.user;
    
      const userId = authenticatedUser._id;
    
      const files = req.s3FileUrls;
       const newePuja = new EPuja({
        title,
        ePujaDate,
        end_at,
        description,
        day,
        price,
        cityId,
        stateId,
        cityId,
        stateId,
        createdBy:userId,
        files,
     
       });
     
       const savedePuja = await newePuja.save();
     
       return res.status(200).json({message:"Record Created Successfully"});
     
});

exports.updateEPuja = catchError(async(req, res) =>{
    console.log(req.body);
    const {id} = req.params;
    const {
        title,
        ePujaDate,
        end_at,
        description,
        day,
        price,
        cityId,
        stateId,
    } = req.body;

    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const files = req.s3FileUrls;

    const ePuja = await EPuja.findById(id);

    ePuja.title = title??ePuja.title;
    ePuja.ePujaDate = ePujaDate??ePuja.ePujaDate;
    ePuja.end_at = end_at??ePuja.end_at;
    ePuja.description = description??ePuja.ePuja.description
    ePuja.day = day??ePuja.day;
    ePuja.price = price??ePuja.price;
    ePuja.cityId = cityId??ePuja.cityId;
    ePuja.stateId = stateId??ePuja.stateId;
    ePuja.files = files??ePuja.files;

    const updateEPuja = await ePuja.save();
     
    return res.status(200).json({message:"Record Updated Successfully"});
  

});



exports.getAllEPuja = catchError(async(req, res) =>{
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
    
        let query = {};
        
        if (req.query.title) {
            query.title = req.query.title; 
        }
        const ePujaLists = await EPuja.find(query)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('cityId', 'name')
        .populate('stateId', 'name')
        .lean();
        return res.status(200).json({
            data:ePujaLists,
            currentPage: page,
            totalPages: Math.ceil(await EPuja.countDocuments(query) / pageSize),
            count: Math.ceil(await EPuja.countDocuments(query)),
        });
});

exports.getPujaId = catchError(async(req, res) =>{
    const ePuja = await EPuja.findById(req.params.id);

    return res.status(200).json({data:ePuja});
});