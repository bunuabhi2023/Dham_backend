const Razorpay = require("razorpay");
const Booking = require("../models/booking");
const HotelsRooms = require('../models/hotelsRooms');
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

exports.createBooking = catchError(async (req, res) => {
  const {hotelId,roomId,checkInDate,checkOutDate,discountPrice,paidAmount,paymentMethod, 
  } = req.body;

      
  const authenticatedCustomer = req.customer;

  const customerId = authenticatedCustomer?authenticatedCustomer._id:null;

  const customerFirstName = authenticatedCustomer?authenticatedCustomer.firstname:null;
  const customerLastName = authenticatedCustomer?authenticatedCustomer.lastname:null;
  const mobile = authenticatedCustomer?authenticatedCustomer.mobile:null;
  const email = authenticatedCustomer?authenticatedCustomer.email:null;
  const state = authenticatedCustomer?authenticatedCustomer.state:null;
  const city = authenticatedCustomer?authenticatedCustomer.city:null;
  const pincode = authenticatedCustomer?authenticatedCustomer.pincode:null;

  const roomDetails = await HotelsRooms.findById(roomId).exec();
  const perDayPrice = roomDetails.offerPrice;

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  const timeDifference = checkOut.getTime() - checkIn.getTime();

  const totalDays = timeDifference / (1000 * 3600 * 24);

  const totalPrice = perDayPrice * totalDays;

  const taxAmount = totalPrice * (18/100);
  const finalPrice = totalPrice + taxAmount - discountPrice;




  if (!paymentMethod) {
    return res.status(400).json({ message: 'Payment method is required' });
  }

  const dueAmount = finalPrice - paidAmount;

  let isPartialPay = false;

  if(dueAmount > 0){
    isPartialPay = true;
  }else{
    isPartialPay = false;
  }

  const commission = await Commission.find({userId:hotelId}).lean().exec();

  const totalCommission = (finalPrice * (commission[0].commissionPercentage)/100)??0;

  const propertyOwnerIncome = finalPrice - totalCommission;
  
  const newBooking = new Booking({
    hotelId,
    roomId,
    customerId,
    customerFirstName,
    customerLastName,
    email,
    mobile,
    state,
    city,
    pincode,
    checkInDate,
    checkOutDate,
    perDayPrice,
    taxAmount,
    totalPrice,
    discountPrice,
    finalPrice,
    isPartialPay,
    paidAmount,
    totalCommission,
    propertyOwnerIncome,
    dueAmount:dueAmount,
    bookingStatus: "pending",
    paymentStatus: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  try {
  
    // if (paymentMethod === "cash") {
    //   newBooking.bookingStatus = "booked";
    //   newBooking.paymentStatus = "pending";

    //   const savedBooking = await newBooking.save();

    //   return res.status(200).json({
    //     message: "Booking created successfully with cash payment",
    //     booking: savedBooking
    //   });
    // }


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
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
          bookingStatus: "booked",
          paymentStatus: "paid"
        }, { new: true });
  
        return res.status(200).json({
          message: "Payment  successfully Done. Thank You for booking with us 🙏",
          booking: updatedBooking
        });
      } else {
        // If the signature doesn't match, update booking status to "pending" and payment status to "canceled"
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
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
    const bookings = await Booking.find({customerId:customerId})
                     .populate('hotelId', 'name files') 
                     .populate({
                      path: 'roomId',
                      populate: {
                        path: 'roomCategoryId',
                        select: 'name' 
                      }
                    })
                     .exec();

    const updatedBookings = bookings.map(booking => {
        const bookingObj = booking.toObject();
        bookingObj.id = bookingObj._id;
        delete bookingObj._id;
        
        return bookingObj;
    });

    return res.status(200).json({bookings:updatedBookings});
  })
  
