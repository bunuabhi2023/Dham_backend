const User = require('../models/user');
const Customer = require('../models/customer');
const Booking = require('../models/booking');

exports.dashBoardData = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalHotel = await User.countDocuments({ role: 'Hotel' });

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); 
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Next month, first day

        // Calculate total bookings for the current month
        const totalBookingsThisMonth = await Booking.countDocuments({
            createdAt: { 
                $gte: startOfMonth, 
                $lt: endOfMonth // End of this month is the start of the next month
            }
        });

        // Calculate total revenue from all bookings
        const totalRevenue = await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalCommission" }
                }
            }
        ]);

        // Calculate this month's revenue
        const thisMonthRevenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfMonth,
                        $lt: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalCommission" }
                }
            }
        ]);

        const dashBoardData = {
            totalCustomer: totalCustomers,
            totalHotel: totalHotel,
            totalBookingsThisMonth: totalBookingsThisMonth,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            thisMonthRevenue: thisMonthRevenue.length > 0 ? thisMonthRevenue[0].total : 0
        };

        res.json({ dashBoardData });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
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
            createdAt: { $gte: startString, $lte: endString }
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
