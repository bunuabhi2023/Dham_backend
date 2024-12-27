const Razorpay = require("razorpay");
const EPujaBooking = require("../models/ePujaBooking");
const EPuja = require('../models/epuja');
const { catchError } = require("../middlewares/CatchError");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: 'rzp_live_9ahH7HBC42cQqs',
  key_secret: '7Y0JRuImra6jOV9s9z6OxDZK'
});

function hmac_sha256(data, key) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("hex");
}

exports.createPujaBooking = catchError(async (req, res) => {
  const {ePujaId,bookingDate,gotra,note,cityId,firstName,lastName,price 
  } = req.body;

      
  const authenticatedCustomer = req.customer;

  const customerId = authenticatedCustomer?authenticatedCustomer._id:null;


  const newBooking = new EPujaBooking({
    ePujaId,
    customerId,
    bookingDate,
    gotra,
    firstName,
    lastName,
    price,
    cityId,
    note,
    bookingStatus: "pending",
    paymentStatus: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  try {
  
      const amountToPay = price * 100;


      const options = {
        amount: amountToPay,  
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
        payment_capture: 1
      };

      const razorpayOrder = await razorpay.orders.create(options);

      const savedBooking = await newBooking.save();

      // Return booking and Razorpay order details to the client
      return res.status(200).json({
        message: "Booking created successfully with online payment",
        bookingId: savedBooking._id,
        razorpayOrderId: razorpayOrder.id,
        amountToPay: amountToPay / 100,
        currency: razorpayOrder.currency
      });
    
  } catch (error) {
    return res.status(500).json({
      message: "Error creating booking or processing payment",
      error: error.message
    });
  }
});


exports.verifyRazorpayPayment = catchError(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  
    try {
      const secret = '7Y0JRuImra6jOV9s9z6OxDZK';
      // Verify the signature using Razorpay secret
      const expectedSignature = hmac_sha256(
        `${razorpay_order_id}|${razorpay_payment_id}`,
        secret
    );

      if (expectedSignature === razorpay_signature) {
        // Update booking status to "booked" and payment status to "paid"
        const booking = await EPujaBooking.findById(bookingId);

        if (!booking) {
        // Handle case where booking is not found
        throw new Error('Booking not found');
        }

        let paymentStatus = "paid";

        const updatedBooking = await EPujaBooking.findByIdAndUpdate(bookingId, {
          bookingStatus: "booked",
          paymentStatus: paymentStatus
        }, { new: true });
  
        return res.status(200).json({
          message: "Payment  successfully Done. Thank You for booking with us 🙏",
          booking: updatedBooking
        });
      } else {
        // If the signature doesn't match, update booking status to "pending" and payment status to "canceled"
        const updatedBooking = await EPujaBooking.findByIdAndUpdate(bookingId, {
          bookingStatus: "pending",
          paymentStatus: "canceled"
        }, { new: true });
  
        return res.status(400).json({
          message: "Payment verification failed",
          booking: updatedBooking
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Error verifying payment",
        error: error.message
      });
    }
  });


  exports.getBookingByCustomer = catchError(async(req, res) =>{
    
    const authenticatedCustomer = req.customer;

    const customerId = authenticatedCustomer?authenticatedCustomer._id:null;
    const bookings = await EPujaBooking.find({customerId:customerId})
                     .populate('ePujaId', 'title') 
                     .exec();

    return res.status(200).json({bookings:bookings});
  });

  exports.getBookingByAdmin = catchError(async(req, res) =>{
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};

    const bookings = await EPujaBooking.find(query)
      .populate('ePujaId', 'title') 
      .populate('customerId', 'firstname lastname') 
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
    
    return res.status(200).json({
        bookings,
        currentPage: page,
        totalPages: Math.ceil(await EPujaBooking.countDocuments(query) / pageSize),
        count: Math.ceil(await EPujaBooking.countDocuments(query)),
    });
  })
  
