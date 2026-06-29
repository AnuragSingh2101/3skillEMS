const mongoose = require('mongoose');
const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    let queryObj = {};

    if (category && category !== 'All') {
      queryObj.category = category;
    }

    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(queryObj)
      .populate('organizer', 'name email')
      .sort({ date: 1 });

    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, date, time, location, ticketPrice, capacity, bannerImage } = req.body;
    const organizerId = req.user._id || req.user.id;

    if (!title || !description || !category || !date || !time || !location || ticketPrice === undefined || !capacity) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    const event = await Event.create({
      title,
      description,
      category,
      date,
      time,
      location,
      ticketPrice: Number(ticketPrice),
      capacity: Number(capacity),
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Make sure user is event organizer
    if (event.organizer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    event = await Event.findByIdAndUpdate(eventId, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
