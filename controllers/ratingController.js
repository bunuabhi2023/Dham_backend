const Rating = require('../models/rating');

exports.creatRating = async(req, res) =>{
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const {userId, rating, comment} =req.body;

    try {
        const newRating = new Rating({
            customerId,
            userId,
            rating,
            comment,
          });
      
          // Save the new customer to the database
          await newRating.save();
      
          return res.status(201).json({ message: 'Thank You For Your rating' });
    } catch (error) {
        
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.updateRating = async(req, res) =>{
    const ratingId = req.params.id;
    try {
        const {userId, rating, comment} = req.body;

        const esxitingRating = await Rating.findOne({_id:ratingId, userId:userId});

        if(!esxitingRating){
            return res.status(404).json({ message: 'Not Found' });
        }

        esxitingRating.rating = rating;
        esxitingRating.comment = comment;
        esxitingRating.save();
        return res.status(201).json({ message: 'Thank You For Your rating' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.getEscortRating = async(req, res) =>{
    try {
        const userId = req.params.id;
        const ratings = await Rating.find({userId:userId}).populate('customerId', 'name').populate('userId', 'name').exec();

        if(!ratings){
            return null;
        }
        return res.status(201).json(ratings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
        
    }
}