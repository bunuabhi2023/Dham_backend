const Razorpay = require("razorpay");
const GuideBooking = require("../models/guideBooking");
const Guide = require('../models/guid');
const Commission = require('../models/commission');
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

exports.createGuideBooking = catchError(async (req, res) => {
  const {guideId,bookingDate,bookingTimeFrom,bookingTimeTo,totalBookingHours,discountPrice,paidAmount,paymentMethod 
  } = req.body;

      
  const authenticatedCustomer = req.customer;

  const customerId = authenticatedCustomer?authenticatedCustomer._id:null;


  const guideDetails = await Guide.findById(guideId).exec();
  const perHourPrice = guideDetails.pricePerHour;


  const totPrice = perHourPrice * totalBookingHours;

  const taxAmount = totPrice * (18/100);
  const totalPrice = totPrice + taxAmount - discountPrice;




  if (!paymentMethod) {
    return res.status(400).json({ message: 'Payment method is required' });
  }

  const dueAmount = totalPrice - paidAmount;

  let isPartialPay = false;

  if(dueAmount > 0){
    isPartialPay = true;
  }else{
    isPartialPay = false;
  }

  
  const totalCommission = totalPrice * 0.05;
 
  const guideIncome = totalPrice - totalCommission;

  const newBooking = new GuideBooking({
    guideId,
    customerId,
    bookingDate,
    bookingTimeFrom,
    bookingTimeTo,
    totalBookingHours,
    discountPrice,
    paidAmount,
    perHourPrice,
    taxAmount,
    totalPrice,
    discountPrice,
    isPartialPay,
    paidAmount,
    guideIncome,
    totalCommission,
    dueAmount:dueAmount,
    bookingStatus: "pending",
    paymentStatus: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  try {
  

    if (paymentMethod === "online") {
      const amountToPay = paidAmount * 100;


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
    }
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
        const booking = await GuideBooking.findById(bookingId);

        if (!booking) {
        // Handle case where booking is not found
        throw new Error('Booking not found');
        }

        let paymentStatus = "paid";

        if (booking.paidAmount < booking.totalPrice) {
        paymentStatus = "partial_paid";
        }

        const updatedBooking = await GuideBooking.findByIdAndUpdate(bookingId, {
          bookingStatus: "booked",
          paymentStatus: paymentStatus
        }, { new: true });
  
        return res.status(200).json({
          message: "Payment  successfully Done. Thank You for booking with us 🙏",
          booking: updatedBooking
        });
      } else {
        // If the signature doesn't match, update booking status to "pending" and payment status to "canceled"
        const updatedBooking = await GuideBooking.findByIdAndUpdate(bookingId, {
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
    const bookings = await GuideBooking.find({customerId:customerId})
                     .populate('guideId', 'name file') 
                     .exec();

    const updatedBookings = bookings.map(booking => {
        const bookingObj = booking.toObject();
        bookingObj.id = bookingObj._id;
        delete bookingObj._id;
        
        return bookingObj;
    });

    return res.status(200).json({bookings:updatedBookings});
  });

  exports.getBookingByAdmin = catchError(async(req, res) =>{
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let query = {};

    const bookings = await GuideBooking.find(query)
      .populate('guideId', 'name files') 
      .populate('customerId', 'firstname lastname') 
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
    
    return res.status(200).json({
        bookings,
        currentPage: page,
        totalPages: Math.ceil(await GuideBooking.countDocuments(query) / pageSize),
        count: Math.ceil(await GuideBooking.countDocuments(query)),
    });
  })
  
