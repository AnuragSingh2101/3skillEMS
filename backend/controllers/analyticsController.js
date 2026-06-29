const Event = require('../models/Event');
const Booking = require('../models/Booking');
const mockDb = require('../models/mockDb');
const mongoose = require('mongoose');


exports.getOrganizerAnalytics = async (req, res) => {
  try {
    const organizerId = req.user._id || req.user.id;
    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      // Find organizer's events
      const orgEvents = mockDb.events.filter((e) => e.organizer === organizerId);
      const orgEventIds = orgEvents.map((e) => e._id);

      // Find bookings for these events
      const bookings = mockDb.bookings.filter((b) => orgEventIds.includes(b.event));

      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let checkInCount = 0;

      bookings.forEach((b) => {
        totalRevenue += b.totalPrice;
        totalTicketsSold += b.ticketQuantity;
        if (b.checkedIn) {
          checkInCount += b.ticketQuantity;
        }
      });

      const totalBookingsCount = bookings.length;
      const attendanceRate = totalTicketsSold > 0 ? Math.round((checkInCount / totalTicketsSold) * 100) : 0;
      const activeEventsCount = orgEvents.filter((e) => new Date(e.date) >= new Date()).length;

      // Group ticket sales by category
      const categorySales = {};
      orgEvents.forEach((e) => {
        if (!categorySales[e.category]) {
          categorySales[e.category] = 0;
        }
        categorySales[e.category] += e.ticketsSold;
      });

      const categoryData = Object.keys(categorySales).map((cat) => ({
        name: cat,
        value: categorySales[cat]
      }));

      const salesByDate = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        salesByDate[dateStr] = { revenue: 0, tickets: 0 };
      }

      bookings.forEach((b) => {
        const dateStr = new Date(b.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (salesByDate[dateStr]) {
          salesByDate[dateStr].revenue += b.totalPrice;
          salesByDate[dateStr].tickets += b.ticketQuantity;
        }
      });

      const salesTrend = Object.keys(salesByDate).map((date) => ({
        date,
        revenue: salesByDate[date].revenue,
        tickets: salesByDate[date].tickets
      }));

      // Event performance breakdown
      const eventBreakdown = orgEvents.map((e) => {
        const eventBookings = bookings.filter((b) => b.event === e._id);
        const revenue = eventBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        return {
          id: e._id,
          title: e.title,
          ticketsSold: e.ticketsSold,
          capacity: e.capacity,
          revenue: revenue,
          occupancyRate: Math.round((e.ticketsSold / e.capacity) * 100)
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalTicketsSold,
            attendanceRate,
            activeEventsCount,
            totalBookingsCount
          },
          categoryData,
          salesTrend,
          eventBreakdown
        }
      });
    } else {
      // Mongoose DB Aggregation
      const orgEvents = await Event.find({ organizer: organizerId });
      const orgEventIds = orgEvents.map((e) => e._id);

      if (orgEventIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            summary: { totalRevenue: 0, totalTicketsSold: 0, attendanceRate: 0, activeEventsCount: 0, totalBookingsCount: 0 },
            categoryData: [],
            salesTrend: [],
            eventBreakdown: []
          }
        });
      }

      // 1. Core Summary Metrics
      const bookings = await Booking.find({ event: { $in: orgEventIds } });
      
      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let checkInCount = 0;

      bookings.forEach((b) => {
        if (b.paymentStatus === 'paid') {
          totalRevenue += b.totalPrice;
          totalTicketsSold += b.ticketQuantity;
          if (b.checkedIn) {
            checkInCount += b.ticketQuantity;
          }
        }
      });

      const attendanceRate = totalTicketsSold > 0 ? Math.round((checkInCount / totalTicketsSold) * 100) : 0;
      const activeEventsCount = await Event.countDocuments({
        organizer: organizerId,
        date: { $gte: new Date() }
      });

      // 2. Category Performance
      const categoryAgg = await Event.aggregate([
        { $match: { organizer: new mongoose.Types.ObjectId(organizerId) } },
        { $group: { _id: '$category', value: { $sum: '$ticketsSold' } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]);

      // 3. Sales Trend 
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const salesTrendAgg = await Booking.aggregate([
        { 
          $match: { 
            event: { $in: orgEventIds },
            paymentStatus: 'paid',
            bookingDate: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
            revenue: { $sum: '$totalPrice' },
            tickets: { $sum: '$ticketQuantity' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Map dates to User-friendly labels
      const salesTrend = salesTrendAgg.map((item) => {
        const parts = item._id.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: item.revenue,
          tickets: item.tickets
        };
      });


      // 4. Detailed Event Breakdown
      const eventBreakdown = orgEvents.map((e) => {
        const eventBookings = bookings.filter((b) => b.event.toString() === e._id.toString());
        const revenue = eventBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        return {
          id: e._id,
          title: e.title,
          ticketsSold: e.ticketsSold,
          capacity: e.capacity,
          revenue: revenue,
          occupancyRate: e.capacity > 0 ? Math.round((e.ticketsSold / e.capacity) * 100) : 0
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalTicketsSold,
            attendanceRate,
            activeEventsCount,
            totalBookingsCount: bookings.length
          },
          categoryData: categoryAgg,
          salesTrend,
          eventBreakdown
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
