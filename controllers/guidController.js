const Guid = require('../models/guid');
const bcrypt = require('bcryptjs');
const {catchError} = require('../middlewares/CatchError');

exports.createGuid = catchError(async(req, res) =>{
    const { name, email, mobile, password,  cityId, pincode, address, location } = req.body;
    const file = req.s3FileUrl;
    const existingUser = await Guid.findOne({
        $or: [{ email }, { mobile }],
    });

    if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newGuid = new Guid({
      name,
      email,
      mobile,
      password: hashedPassword,
      cityId,
      pincode,
      address,
      location,
      file
    });

   
    
    await newGuid.save();
    return res.status(201).json({ message: 'New Guid created successfully' });

    
});