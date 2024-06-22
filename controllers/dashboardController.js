const User = require('../models/user');
const Customer = require('../models/customer');
const Booking = require('../models/booking');

exports.dashBoardData = async(req, res) =>{
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalEscorts = await User.countDocuments({ role: 'Escort' });
       
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of the day
    
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Set to the beginning of the next day
    
        // Convert today and tomorrow to strings in the format "YYYY-MM-DD"
        const todayString = today.toISOString().split('T')[0];
        const tomorrowString = tomorrow.toISOString().split('T')[0];
    
        const totalBookingsToday = await Booking.countDocuments({
            bookingDate: tomorrowString
        });
        const dashBoardData = {
            totalCustomer: totalCustomers,
            totalEscorts: totalEscorts,
            totalBookingsToday:totalBookingsToday
        }
        res.json({ dashBoardData });
    } catch (error) {
    res.status(500).json({ error: 'Could not fetch total customers.' });
    }
};


exports.getMonthlyBookingCounts = async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear(); // Default to current year if not provided
        const bookingsByMonth = await getBookingsByMonth(year);
        const formattedData = formatMonthlyBookingCounts(bookingsByMonth);
        res.json({ monthlyBookingCounts: formattedData });
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch monthly booking counts.' });
    }
};

const getBookingsByMonth = async (year) => {
    const bookingsByMonth = [];

    for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const startString = startDate.toISOString().split('T')[0];
        const endString = endDate.toISOString().split('T')[0];

        const count = await Booking.countDocuments({
            bookingDate: { $gte: startString, $lte: endString }
        });

        bookingsByMonth.push({ monthName: getMonthName(month), count });
    }

    return bookingsByMonth;
};

const getMonthName = (month) => {
    const monthNames = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    return monthNames[month];
};

const formatMonthlyBookingCounts = (bookingsByMonth) => {
    const formattedData = {};
    bookingsByMonth.forEach(item => {
        formattedData[item.monthName] = item.count;
    });
    return formattedData;
};
