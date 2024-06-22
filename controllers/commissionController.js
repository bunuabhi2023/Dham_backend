const Commission = require('../models/commission');

exports.setCommission = async(req, res) =>{
    try {
        const {userId, commissionPercentage} = req.body;

        const commission = await Commission.findOne({userId:userId});
        if(commission){
            commission.commissionPercentage = commissionPercentage;
            commission.save();
            return res.status(200).json(commission);
        }

        const newCommission = new Commission({
            userId,
            commissionPercentage
        })

        const savedCommission = await newCommission.save();
        console.log(savedCommission); 
        res.json(savedCommission);
        
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ error: 'Failed to create Service' });
        
    }
};

exports.getAllCommission = async(req, res) =>{
    try {
        const commissions = await Commission.find().populate('userId', 'name').exec();
        if(!commissions){
            return null;
        }
        return res.status(200).json(commissions);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create Service' });
    }
};

exports.getCommissionByEscort = async(req, res) =>{
    try {
        const userId = req.params.id;
        const commission = await Commission.findOne({userId:userId}).populate('userId', 'name').exec();
        if(!commission){
            return null;
        }
        return res.status(200).json(commission);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create Service' });
    }
}

