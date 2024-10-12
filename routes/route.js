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
const hotelRoomsController = require('../controllers/hotelRoomsController');
const amenitiesController = require('../controllers/amenitiesController');
const roomCategoryController = require('../controllers/roomCategoryController');
const nearbyController = require('../controllers/nearbyController');
const guidController = require('../controllers/guidController');
const blogController = require('../controllers/blogController');
const homeController = require('../controllers/homeController');
const propertyTypeController =  require('../controllers/propertyTypeController');
const tourEventController = require('../controllers/tourEventController');
const foodAndDiningController = require('../controllers/foodAndDiningController');




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
router.post("/otp-verify", customerController.verifyOtp);
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
router.get('/search', customerController.search);

//Home Routes//

router.get("/top-hotels", homeController.TopHotels);
router.get("/top-nearby", homeController.TopNearBy);

//Booking Routes//
router.post("/book-property",customerAuth, bookingController.createBooking);
router.post("/verify-payment", bookingController.verifyRazorpayPayment);



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
router.get("/get-commission-by-hotel/:id", auth, isAdmin,  commissionController.getCommissionByHotel);


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
router.delete("/delete-country/:id", auth, isAdmin, countryController.deleteCountry);

//State Route//
router.post("/create-state", auth, isAdmin, stateController.createState);
router.get("/get-state-by-admin", auth, isAdmin, stateController.getStateBySuperAdmin);
router.put("/update-state/:id", auth, isAdmin, stateController.updateSate);
router.get("/get-all-states",  stateController.getAllState);
router.get("/get-state-by-country/:countryId",  stateController.getByCountry);
router.delete("/delete-state/:id", auth, isAdmin, stateController.deleteState);

//City Route//
router.post("/create-city",imageSingleUpload, auth, isAdmin, cityController.createCity);
router.get("/get-all-city",  cityController.getAllCity);
router.get("/get-city-by-state/:stateId", cityController.getByState);
router.put("/update-city/:id",imageSingleUpload, auth, isAdmin, cityController.updateCity);
router.delete("/delete-city/:id", auth, isAdmin, cityController.deleteCity);
router.get("/get-city-by-admin", auth, isAdmin, cityController.getCityBySuperAdmin);

//Hotel Room Ctegory Routes//
router.post("/create-room-category", auth, isAdmin, roomCategoryController.createRoomCategory);
router.get("/get-all-room-categories", roomCategoryController.getAllRoomCategory);
router.get("/get-room-category-by-id/:id", roomCategoryController.getRoomCategoryById);
router.put("/update-room-category/:id", auth, isAdmin, roomCategoryController.updateRoomCategory);
router.delete("/delete-room-category/:id", auth, isAdmin, roomCategoryController.deleteRoomCategory);

//Amenity Route//
router.post("/create-amenity",imageSingleUpload, auth, isAdmin, amenitiesController.createAmenity);
router.get("/get-amenities", amenitiesController.getAmenities);
router.get("/get-amenity-by-id/:id", amenitiesController.getAmenitiesById);
router.put("/update-amenity/:id", imageSingleUpload, auth, isAdmin, amenitiesController.updateAmenity);
router.delete("/delete-amenity/:id", auth, isAdmin, amenitiesController.deleteAmenity);
router.get("/get-all-amenities", amenitiesController.getAllAmenities);


//Hotel Management Routes//
router.post("/create-hotel", imageMultiUpload, auth, isAdmin, hotelController.createHotel);
router.put("/update-hotel/:id",imageMultiUpload, auth, isAdmin, hotelController.updateHotel);
router.get("/get-my-hotels", auth, isAdmin, hotelController.getMyHotels);
router.get("/get-hotels", hotelController.getHotelsForUser);
router.get("/get-all-hotels", hotelController.getAllHotels);
router.get("/get-hotel-by-id/:id", hotelController.getHotelById);
router.delete("/delete-hotel/:id", auth, isAdmin, hotelController.deleteHotel);
router.get("/get-hotel-details/:cityId/:id", hotelController.gethotelDetails);
router.get("/get-hotel-by-city/:cityId", hotelController.getHotelByCity);

//Hotel Rooms Management//
router.post("/create-room-by-admin", auth, isAdmin, imageMultiUpload, hotelRoomsController.createRoomsByAdmin);
router.post("/create-my-room", auth, isHotel, imageMultiUpload, hotelRoomsController.createMyRooms);
router.get("/get-rooms-by-admin", auth, isAdmin, hotelRoomsController.getAllHotelsRooms);
router.get("/get-my-rooms", auth, isHotel, hotelRoomsController.getAllMyHotelsRooms);
router.get("/get-room-by-id/:id", hotelRoomsController.getRoomsById);
router.put("/update-room-by-super-admin/:id", imageMultiUpload, auth,  hotelRoomsController.updateHotelRoom);
router.delete("/delete-room/:id", auth,  hotelRoomsController.deleteHotelRoom);

//Near By Routes//
router.post("/create-nearby", imageSingleUpload, auth, isAdmin, nearbyController.createNearBy);
router.put("/update-nearby/:id", imageSingleUpload, auth, isAdmin, nearbyController.updateNearBy);
router.get("/get-all-nearby",  auth, isAdmin, nearbyController.getAllNearBy);

//Guid Route//
router.post("/create-guid", imageSingleUpload, auth, isAdmin, guidController.createGuid);
router.put("/update-guid/:id", imageSingleUpload, auth, isAdmin, guidController.editGuid);
router.get("/get-guid-by-city/:cityId", guidController.getGuidByCity);
router.get("/get-all-guid",auth, isAdmin, guidController.getAllGuids);
router.delete("/delete-guid/:id", auth, isAdmin, guidController.deleteGuid);
router.get("/guids", guidController.getGuides);
router.get("/get-guide-by-id/:id", guidController.getGuideById);

//Blog Routes//
router.post("/create-blog", imageMultiUpload, auth, isAdmin, blogController.createBlog);
router.get("/get-blog-by-admin",  auth, isAdmin, blogController.getBlogByAdmin);
router.get("/get-blog-by-id/:id",  blogController.getBlogById);
router.put("/update-blog/:id", imageMultiUpload, auth, isAdmin, blogController.updateBlog);
router.put("/publish-blog/:id",  auth, isAdmin, blogController.publishBlog);
router.get("/get-blogs",  blogController.getAllBlogs);
router.get("/recent-blogs",  blogController.getRecentBlogs);
router.delete("/delete-blog/:id",  auth, isAdmin, blogController.deleteBlog);


//Property Type//
router.post("/create-property-type", auth, isAdmin, propertyTypeController.createPropertyType);
router.get("/get-all-property-type", propertyTypeController.getAllPropertyType);


//Tour And Event Routes//
router.post("/create-tour-event",imageMultiUpload, auth, isAdmin, tourEventController.createTourEvent);
router.put("/update-tour-event/:id",imageMultiUpload, auth, isAdmin, tourEventController.updateTourEvent);
router.get("/all-events-tours", tourEventController.getAllEventsAndTours);
router.get("/get-current-city-tour", tourEventController.currentCityTour);
router.get("/upcoming-tours-events", tourEventController.upComingTourEvent);
router.get("/top-destinations", tourEventController.topDestination);
router.get("/event-tour-by-id/:id", tourEventController.getTourAndEventById);
router.delete("/delete-event-tour/:id",auth, isAdmin, tourEventController.deleteTourEvent);

//food and dining routes//
router.post("/create-food-and-dining", auth, isAdmin, foodAndDiningController.createFoodAndDining);
router.put("/update-food-and-dining/:id", auth, isAdmin, foodAndDiningController.updateFoodDiningById);
router.get("/get-food-and-dining", auth, isAdmin, foodAndDiningController.getFoodAndDining);
router.get("/food-and-dining-by-id/:id", foodAndDiningController.getFoodDiningById);
router.get("/all-food-and-dining", foodAndDiningController.getAllFoodDining);
router.delete("/delete-food-and-dining/:id", auth, isAdmin, foodAndDiningController.deleteFoodDining);


module.exports = router;