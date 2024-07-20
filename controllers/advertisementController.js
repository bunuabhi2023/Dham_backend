const Advertisement = require('../models/advertisement');

const createAdvertisement = async (req, res) => {
    const { title, description, validFrom, validUpto, offerOnItem, cityId, discountPercentage, discountAmount} = req.body;
    const createdBy = req.user.id;
    const file = req.s3FileUrl;

   const newAdvertisement = new Advertisement({
    title, 
    description, 
    validFrom, 
    validUpto, 
    offerOnItem, 
    cityId, 
    discountPercentage, 
    discountAmount,
    file,
    createdBy,
    });

    try {
      const savedAdvertisement = await newAdvertisement.save();
      console.log(savedAdvertisement); // Add this line for debug logging
      res.status(200).json({ message: 'Advertisement created Successfuly' });
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to create Advertisement' });
    }
};

const updateAdvertisement = async (req, res) => {
  
  const { title, description, validFrom, validUpto, offerOnItem, cityId, discountPercentage, discountAmount} = req.body;
    const updatedBy = req.user.id;
      const file = req.s3FileUrl;
      updateFields = {
        title, 
        description, 
        validFrom, 
        validUpto, 
        offerOnItem, 
        cityId, 
        discountPercentage, 
        discountAmount,
        file,
        updatedBy,
        updatedAt: Date.now(),
      };
    

    try {
      const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      );

      if (!updatedAdvertisement) {
        console.log(`Advertisement with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      console.log(updatedAdvertisement);
     return res.status(200).json({data:updatedAdvertisement, message:"Record Updated Successfully!"});
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Advertisement' });
    }
};

// Function to get all Advertisement
const getAllAdvertisement = async (req, res)  => {
  try {
    const advertisements = await Advertisement.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();
      
        res.json(advertisements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
};

const getAllAdvertisementForAdmin = async (req, res)  => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};
    const advertisements = await Advertisement.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
      
      return res.status(200).json({
        advertisements,
        currentPage: page,
        totalPages: Math.ceil(await Advertisement.countDocuments(query) / pageSize),
        count: Math.ceil(await Advertisement.countDocuments(query)),
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
};



// Function to get a discount by ID
const getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();

    if (!advertisement) {
      console.log(`Advertisement with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Advertisement  not found' });
    }
    
    res.json(advertisement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discount' });
  }
};


// Function to delete a discount by ID
const deleteAdvertisement = async (req, res) => {
  try {
    const deletedAdvertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!deletedAdvertisement) {
      console.log(`Advertisement with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete Advertisement' });
  }
};

const changeStatus = async(req, res) => {
  try {
    const id = req.params.id;
    const unpateStatus = await Advertisement.findByIdAndUpdate(
      {_id:id}, 
      {status:req.body.status},
      {new:true}
      );

    if(!unpateStatus){
      return res.status(404).json({error:"Advertisement Not Found"});
    }

    return res.status(200).json({message:"Advertisement Status Changed"});
  } catch (error) {
    return res.status(500).json({error:"Failed To Change Advertisement Status"});
  }
}

module.exports = {
    createAdvertisement,
    updateAdvertisement,
    getAllAdvertisement,
    getAdvertisementById,
    deleteAdvertisement,
    changeStatus,
    getAllAdvertisementForAdmin
  };