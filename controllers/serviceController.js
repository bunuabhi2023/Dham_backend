const Service = require('../models/service');

// Function to create a new Size
const createService = async (req, res) => {
  
      const { name } = req.body;
      const authenticatedUser = req.user;

      const userId = authenticatedUser._id;
      const createdBy = userId;
      const file = req.s3FileUrl;
  
  
      const newService = new Service({ name, file, createdBy });
  
      try {
        const savedService = await newService.save();
        console.log(savedService); // Add this line for debug logging
        res.json(savedService);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to create Service' });
      }
   
  };

  
// Function to update a category by ID
const updateService = async (req, res) => {
    
  
      const { name } = req.body;
      const updatedBy = req.user.id;
      const file = req.s3FileUrl;
  
  
      try {
        const updatedService = await Service.findByIdAndUpdate(
          req.params.id,
          { name, file, updatedBy, updatedAt: Date.now() },
          { new: true }
        );
  
        if (!updatedService) {
          console.log(`Service with ID ${req.params.id} not found`);
          return res.status(404).json({ error: 'Service not found' });
        }
  
        console.log(updatedService); // Add this line for debug logging
        res.json(updatedService);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to update Service' });
      }
};

// Function to get all sizes
const getAllService = async (req, res)  => {
    try {
        const services = await Service.find()
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .exec();
        res.json({services:services});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch services' });
    }
};
  
  // Function to get a size by ID
const getServiceById = async (req, res) => {
try {
    const service = await Service.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .exec();
    if (!service) {
    console.log(`Service with ID ${req.params.id} not found`);
    return res.status(404).json({ error: 'Service not found' });
    }


    res.json(service);
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch service' });
}
};
  
  // Function to delete a Size by ID
const deleteService = async (req, res) => {
    try {
      const deletedService = await Service.findByIdAndDelete(req.params.id);
      if (!deletedService) {
        console.log(`Service with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete Service' });
    }
};
  
  module.exports = {
    createService,
    updateService,
    getAllService,
    getServiceById,
    deleteService,
  };