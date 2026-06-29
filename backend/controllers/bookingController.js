const mongoose = require('mongoose');
const qrCode = require('qrcode');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

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

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const qty = Number(ticketQuantity);
    const eventData = await Event.findById(eventId);

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
      select: 'title date time location ticketPrice bannerImage category'
    });

    return res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: 'event',
        select: 'title date time location ticketPrice bannerImage category'
      })
      .sort({ bookingDate: -1 });

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket / booking ID format.' });
    }

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkInAttendee = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket / booking ID format.' });
    }

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
        message: `Ticket already checked-in on ${new Date(booking.checkedInAt).toLocaleString()}`
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
