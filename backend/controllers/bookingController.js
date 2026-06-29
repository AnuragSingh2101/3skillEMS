const qrCode = require('qrcode');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const mockDb = require('../models/mockDb');

const processSimulatedPayment = async (amount, paymentMethodId) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (paymentMethodId && paymentMethodId.startsWith('pm_card_chargeDeclined')) {
    throw new Error('Your card was declined.');
  }

  return {
    id: 'ch_' + Math.random().toString(36).substr(2, 9),
    status: 'succeeded',
    amount: amount
  };
};


exports.createBooking = async (req, res) => {
  try {
    const { eventId, ticketQuantity, paymentMethodId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!eventId || !ticketQuantity) {
      return res.status(400).json({ success: false, message: 'Please provide eventId and ticketQuantity' });
    }

    const qty = Number(ticketQuantity);
    const isMock = process.env.USE_MOCK_DB === 'true';

    let eventData;
    if (isMock) {
      eventData = mockDb.events.find((e) => e._id === eventId);
    } else {
      eventData = await Event.findById(eventId);
    }

    if (!eventData) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check availability
    const availableTickets = eventData.capacity - eventData.ticketsSold;
    if (qty > availableTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableTickets} tickets remaining for this event.`
      });
    }

    const totalPrice = eventData.ticketPrice * qty;

    let paymentResult;
    try {
      paymentResult = await processSimulatedPayment(totalPrice * 100, paymentMethodId || 'pm_card_visa');
    } catch (paymentErr) {
      return res.status(400).json({ success: false, message: `Payment Failed: ${paymentErr.message}` });
    }

    const bookingIdTemp = isMock 
      ? 'booking_' + Math.random().toString(36).substr(2, 9) 
      : new Object().toString(); // Will overwrite below with actual DB id


    const qrData = JSON.stringify({
      bookingId: bookingIdTemp,
      eventId: eventData._id,
      ticketQuantity: qty,
      userName: req.user.name
    });
    
    const qrCodeDataUrl = await qrCode.toDataURL(qrData);

    if (isMock) {
      const newBooking = {
        _id: bookingIdTemp,
        event: eventId,
        user: userId,
        ticketQuantity: qty,
        totalPrice,
        paymentStatus: 'paid',
        paymentId: paymentResult.id,
        qrCodeUrl: qrCodeDataUrl,
        checkedIn: false,
        checkedInAt: null,
        bookingDate: new Date()
      };

      // Add to mock store
      mockDb.bookings.push(newBooking);

      // Increment tickets sold on mock event
      const eventIndex = mockDb.events.findIndex((e) => e._id === eventId);
      mockDb.events[eventIndex].ticketsSold += qty;

      // Populate response
      const responseData = {
        ...newBooking,
        event: {
          _id: eventData._id,
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          ticketPrice: eventData.ticketPrice
        }
      };

      return res.status(201).json({ success: true, data: responseData });
    } else {
      const booking = new Booking({
        event: eventId,
        user: userId,
        ticketQuantity: qty,
        totalPrice,
        paymentStatus: 'paid',
        paymentId: paymentResult.id,
        qrCodeUrl: '', // Will update
        checkedIn: false
      });

      const qrDataMongo = JSON.stringify({
        bookingId: booking._id.toString(),
        eventId: eventData._id.toString(),
        ticketQuantity: qty,
        userName: req.user.name
      });

      booking.qrCodeUrl = await qrCode.toDataURL(qrDataMongo);
      await booking.save();

      // Update event tickets sold counter
      eventData.ticketsSold += qty;
      await eventData.save();

      const populatedBooking = await Booking.findById(booking._id).populate({
        path: 'event',
        select: 'title date time location ticketPrice'
      });

      return res.status(201).json({ success: true, data: populatedBooking });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const bookings = mockDb.bookings.filter((b) => b.user === userId);
      
      const populatedBookings = bookings.map((b) => {
        const event = mockDb.events.find((e) => e._id === b.event);
        return {
          ...b,
          event: event ? {
            _id: event._id,
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            ticketPrice: event.ticketPrice,
            bannerImage: event.bannerImage
          } : null
        };
      });

      // Sort by date descending
      populatedBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

      return res.status(200).json({ success: true, count: populatedBookings.length, data: populatedBookings });
    } else {
      const bookings = await Booking.find({ user: userId })
        .populate({
          path: 'event',
          select: 'title date time location ticketPrice bannerImage'
        })
        .sort({ bookingDate: -1 });

      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const booking = mockDb.bookings.find((b) => b._id === bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Check access (Attendee who booked, or Organizer of the event)
      const event = mockDb.events.find((e) => e._id === booking.event);
      const isOwner = booking.user === userId;
      const isOrganizer = event && event.organizer === userId;

      if (!isOwner && !isOrganizer) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
      }

      const populatedBooking = {
        ...booking,
        event: event ? {
          _id: event._id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          ticketPrice: event.ticketPrice,
          bannerImage: event.bannerImage,
          organizer: event.organizer
        } : null,
        user: mockDb.users.find(u => u._id === booking.user)
      };

      return res.status(200).json({ success: true, data: populatedBooking });
    } else {
      const booking = await Booking.findById(bookingId)
        .populate('event')
        .populate('user', 'name email');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const isOwner = booking.user._id.toString() === userId.toString();
      const isOrganizer = booking.event.organizer.toString() === userId.toString();

      if (!isOwner && !isOrganizer) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
      }

      return res.status(200).json({ success: true, data: booking });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkInAttendee = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const bookingIndex = mockDb.bookings.findIndex((b) => b._id === bookingId);
      if (bookingIndex === -1) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const booking = mockDb.bookings[bookingIndex];
      const event = mockDb.events.find((e) => e._id === booking.event);

      if (!event || event.organizer !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized: Only the event organizer can scan and check in attendees'
        });
      }

      if (booking.checkedIn) {
        return res.status(400).json({
          success: false,
          message: `Ticket already checked-in on ${new Date(booking.checkedInAt).toLocaleString()}`
        });
      }

      // Perform check-in
      const checkedInTime = new Date();
      mockDb.bookings[bookingIndex].checkedIn = true;
      mockDb.bookings[bookingIndex].checkedInAt = checkedInTime;

      return res.status(200).json({
        success: true,
        message: 'Check-in successful!',
        data: {
          bookingId: booking._id,
          eventTitle: event.title,
          attendeeName: mockDb.users.find((u) => u._id === booking.user)?.name || 'Guest',
          checkedInAt: checkedInTime
        }
      });
    } else {
      const booking = await Booking.findById(bookingId).populate('event').populate('user', 'name');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Verify organization rights
      if (booking.event.organizer.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized: Only the event organizer can scan and check in attendees'
        });
      }

      if (booking.checkedIn) {
        return res.status(400).json({
          success: false,
          message: `Ticket already checked-in on ${booking.checkedInAt.toLocaleString()}`
        });
      }

      // Process check-in
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
      await booking.save();

      return res.status(200).json({
        success: true,
        message: 'Check-in successful!',
        data: {
          bookingId: booking._id,
          eventTitle: booking.event.title,
          attendeeName: booking.user.name,
          checkedInAt: booking.checkedInAt
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
