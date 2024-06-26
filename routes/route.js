const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const advertisementController = require('../controllers/advertisementController');
const serviceController = require('../controllers/serviceController');
const ratingController = require('../controllers/ratingController');
const commissionController = require('../controllers/commissionController');
const bookingController = require('../controllers/bookingController');
const dashboardController = require('../controllers/dashboardController');
const faqsController = require('../controllers/faqsController');
const countryController = require('../controllers/countryController');
const stateController = require('../controllers/stateController');
const cityController =  require('../controllers/cityController');
const hotelController = require('../controllers/hotelController');




const {auth, isAdmin, isHotel}  = require('../middlewares/Auth');

const {customerAuth} = require('../middlewares/CustomerAuth');
const { imageSingleUpload , imageMultiUpload} = require("../middlewares/multer");
const faqs = require("../models/faqs");
// Home 
router.get("/", (req, res) =>{
    res.send("Welcome to Dham Backend");
});
//Admin Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.post("/login-hotel", userController.loginHotel);
router.get("/my-profile", auth, userController.getMyProfile);
router.delete("/delete-user/:id", auth, isAdmin, userController.deleteUser);
router.post("/forget-password",  userController.forgotPassword);
router.post("/reset-password",  userController.resetPassword);
router.post("/change-password", auth, userController.updatePassword);
router.post("/verify-otp",  userController.verifyOtp);
router.post("/verify-email",  userController.verifyEmail);

//Customer Route//
router.post("/register-customer", customerController.signup);
router.post("/login-customer", customerController.login);
router.get("/get-my-profile", customerAuth, customerController.getMyProfile);
router.put("/update-cust-profile",imageSingleUpload, customerAuth, customerController.updateMyProfile);
router.get("/get-customer",  auth, isAdmin, customerController.getAllCustomers);
router.get('/get-customer-by-id/:id', auth, isAdmin, customerController.getCustomerById);
router.get("/get-my-favorite",  customerAuth, customerController.getMyFavorite);
router.post("/add-to-favorite",  customerAuth, customerController.addTofavorite);
router.post("/remove-from-favorite",  customerAuth, customerController.removeFromFavorite);
router.put('/update-customer/:id', imageSingleUpload,auth, isAdmin, customerController.updateCustomer);
router.put('/update-recent-view/:id', customerAuth, customerController.updateRecentlyViewedEscorts);
router.get('/get-recent-view', customerAuth, customerController.getMyRecentView);
router.post("/forget-customer-password",  customerController.forgotCustomerPassword);
router.post("/reset-customer-password",  customerController.resetCustomerPassword);
router.post("/change-customer-password", customerAuth, customerController.updateCustomerPassword);
router.delete("/delete-customer/:id",  auth, isAdmin, customerController.deleteCustomer);

//Booking Routes//
router.post("/book-escort", customerAuth,bookingController.bookEscort);
router.get("/get-all-booking", auth, isAdmin, bookingController.getAllBooking);
router.get("/get-booking-by-id/:id",  bookingController.getBookingById);



//Advertisement  Route//
router.post("/create-advertisement",imageSingleUpload, auth, isAdmin,advertisementController.createAdvertisement);
router.put("/update-advertisement/:id",imageSingleUpload, auth, isAdmin, advertisementController.updateAdvertisement);
router.put("/update-advertisement-status/:id", auth, isAdmin, advertisementController.changeStatus);
router.get("/get-advertisement",  advertisementController.getAllAdvertisement);
router.get("/get-advertisement-for-admin", auth, isAdmin,  advertisementController.getAllAdvertisementForAdmin);
router.get("/get-advertisement-by-id/:id",  advertisementController.getAdvertisementById);
router.delete('/delete-advertisement/:id', auth, isAdmin, advertisementController.deleteAdvertisement);


//Service Route//
router.post("/create-service", imageSingleUpload, auth, isAdmin, serviceController.createService);
router.put('/update-service/:id', imageSingleUpload, auth,isAdmin, serviceController.updateService);
router.get("/get-service",  serviceController.getAllService);
router.get('/get-service-by-id/:id', serviceController.getServiceById);
router.delete('/delete-service/:id', auth, isAdmin, serviceController.deleteService);

//Rating Route//
router.post("/create-rating", customerAuth, ratingController.creatRating);
router.put('/update-rating/:id', customerAuth,  ratingController.updateRating);
router.get("/get-rating/:id",  ratingController.getEscortRating);

//Commission Route//
router.post("/set-commission", auth, isAdmin, commissionController.setCommission);
router.get('/get-all-commission', auth, isAdmin, commissionController.getAllCommission);
router.get("/get-commission-by-escort/:id", auth, isAdmin,  commissionController.getCommissionByEscort);


//Dashboard Route//
router.get("/get-dashboard-data", auth, isAdmin,dashboardController.dashBoardData );
router.get("/get-month-wise-booking", auth, isAdmin,dashboardController.getMonthlyBookingCounts );

//faq Route//
router.post("/create-faq", auth, isAdmin, faqsController.createFaq);
router.put("/update-faq/:id", auth, isAdmin, faqsController.updateFaq);
router.get("/get-all-faq", faqsController.getAllFaqs);
router.get("/get-faq-by-id/:id", faqsController.getFaqById);
router.delete("/delete-faq/:id", auth, isAdmin, faqsController.deleteFaq);

//Country Route//
router.post("/create-country", auth, isAdmin, countryController.saveCountry);
router.get("/get-country-by-super-admin", auth, isAdmin, countryController.getCountryBySuperAdmin);
router.get("/get-country", countryController.getCountry);
router.get("/get-country-by-id/:id", countryController.getCountryById);
router.put("/update-country/:id",  auth, isAdmin, countryController.updateCountry);

//State Route//
router.post("/create-state", auth, isAdmin, stateController.createState);
router.get("/get-all-states",  stateController.getAllState);
router.get("/get-state-by-country/:countryId",  stateController.getByCountry);

//City Route//
router.post("/create-city",imageSingleUpload, auth, isAdmin, cityController.createCity);
router.get("/get-all-city",  cityController.getAllCity);
router.get("/get-city-by-state/:stateId", cityController.getByState);

//Hotel Management Routes//
router.post("/create-hotel", auth, isAdmin, hotelController.createHotel);
router.get("/get-my-hotels", auth, isAdmin, hotelController.getMyHotels);


module.exports = router;