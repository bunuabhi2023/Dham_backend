const jwt = require("jsonwebtoken");
const user = require("../models/user");
require("dotenv").config();

exports.auth = async(req, res , next) => {
 
        let token;

        // Check for token in Authorization header
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success:false,
                message:'Not logged in',
          });
        }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const userId = decodedToken._id;
        console.log({userId, token,decodedToken})
        req.user = await user.findById(userId);
        next();
      } catch (err) {
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token',
      })
    }
 
}



exports.isAdmin = (req,res,next) => {
    try{
            if(req.user.role !== "Admin") {
                return res.status(405).json({
                    success:false,
                    message:'This is a protected route for Admin',
                });
            }
            next();
    }
    catch(error) {
        return res.status(405).json({
            success:false,
            message:'Unauthorized User',
        })
    }
}

exports.isHotel = (req,res,next) => {
    try{
        if(req.user.role !== "Hotel") {
            return res.status(405).json({
                success:false,
                message:'This is a protected route for hotel',
            });
        }
        next();
}
catch(error) {
    return res.status(405).json({
        success:false,
        message:'Unauthorized User',
    })
}
}