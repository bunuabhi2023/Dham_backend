const Razorpay = require("razorpay");
const Booking = require("../models/booking");
const { catchError } = require("../middlewares/CatchError");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: 'rzp_live_RFDCf6fNpIDBTl',
  key_secret: 'EGt4ymeXKGxJ1hTnDr8j0b2j'
});

function hmac_sha256(data, key) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("hex");
}

exports.createBooking = catchError(async (req, res) => {
  const {hotelId,roomId,customerFirstName,customerLastName,email,
    mobile,state,city,pincode,isGuest,checkInDate,checkOutDate,perDayPrice,
    taxAmount,totalPrice,discountPrice,finalPrice,isPartialPay,paidAmount,paymentMethod, 
  } = req.body;

      
  const authenticatedCustomer = req.customer;

  const customerId = authenticatedCustomer?authenticatedCustomer._id:null;

  if (!paymentMethod) {
    return res.status(400).json({ message: 'Payment method is required' });
  }

  const dueAmount = finalPrice - paidAmount;
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
    isGuest,
    checkInDate,
    checkOutDate,
    perDayPrice,
    taxAmount,
    totalPrice,
    discountPrice,
    finalPrice,
    isPartialPay,
    paidAmount,
    dueAmount:dueAmount,
    bookingStatus: "pending",
    paymentStatus: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  try {
  
    if (paymentMethod === "cash") {
      newBooking.bookingStatus = "booked";
      newBooking.paymentStatus = "pending";

      const savedBooking = await newBooking.save();

      return res.status(200).json({
        message: "Booking created successfully with cash payment",
        booking: savedBooking
      });
    }


    if (paymentMethod === "online") {
      const amountToPay = isPartialPay ? paidAmount * 100 : finalPrice * 100;


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
      const secret = 'EGt4ymeXKGxJ1hTnDr8j0b2j';
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
  
