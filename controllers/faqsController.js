const Faq = require('../models/faqs');

exports.createFaq = async(req, res) =>{
    try {
        const {question, answer} = req.body;
        const newFaq = new Faq({question, answer});
        const savedFaq = await newFaq.save();
        return res.status(200).json({faqs:savedFaq})
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error"});
    }
};

exports.updateFaq = async(req, res) =>{
    try {
        const {question, answer} = req.body;
        const faqId = req.params.id;
        const faq = await Faq.findById(faqId);
        if(!faq){
        return res.status(404).json({message:"Record Not Found"});
        }
        faq.question = question;
        faq.answer = answer;
        const savedfaq = await faq.save();
        return res.status(200).json({faqs:savedfaq});
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error"});
    }
};

exports.getAllFaqs = async(req, res) => {
    try {
        const faqs = await Faq.find();
        if(!faqs){ 
        return res.status(200).json({faqs:[]});
        }
        
        return res.status(200).json({faqs: faqs});
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error"});    
    }
};

exports.getFaqById = async(req, res) => {
    try {
        const faqId = req.params.id;
        const faq = await Faq.findById(faqId);
        if(!faq){ 
        return res.status(200).json({faq:[]});
        }
        
        return res.status(200).json({faq: faq});
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error"});    
    }
};

exports.deleteFaq = async (req, res) => {
    try {
      const deleteFaq = await Faq.findByIdAndDelete(req.params.id);
      if (!deleteFaq) {
        console.log(`Faq with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Faq not found' });
      }
      res.json({ message: 'Faq deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete Faq' });
    }
  };