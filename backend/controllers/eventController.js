const Event = require('../models/Event');
const mockDb = require('../models/mockDb');


exports.getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      let filteredEvents = [...mockDb.events];

      if (category && category !== 'All') {
        filteredEvents = filteredEvents.filter(
          (e) => e.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (search) {
        const query = search.toLowerCase();
        filteredEvents = filteredEvents.filter(
          (e) =>
            e.title.toLowerCase().includes(query) ||
            e.description.toLowerCase().includes(query) ||
            e.location.toLowerCase().includes(query)
        );
      }

      // Sort by date ascending
      filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Populate mock organizer
      const populatedEvents = filteredEvents.map((e) => {
        const org = mockDb.users.find((u) => u._id === e.organizer);
        return {
          ...e,
          organizer: org ? { _id: org._id, name: org.name, email: org.email } : null
        };
      });

      return res.status(200).json({ success: true, count: populatedEvents.length, data: populatedEvents });
    } else {
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
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getEvent = async (req, res) => {
  try {
    const isMock = process.env.USE_MOCK_DB === 'true';
    const eventId = req.params.id;

    if (isMock) {
      const event = mockDb.events.find((e) => e._id === eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Populate mock organizer
      const organizer = mockDb.users.find((u) => u._id === event.organizer);
      const populatedEvent = {
        ...event,
        organizer: organizer ? { _id: organizer._id, name: organizer.name, email: organizer.email } : null
      };

      return res.status(200).json({ success: true, data: populatedEvent });
    } else {
      const event = await Event.findById(eventId).populate('organizer', 'name email');
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      return res.status(200).json({ success: true, data: event });
    }
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

    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const newEvent = {
        _id: 'event_' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        category,
        date: new Date(date),
        time,
        location,
        ticketPrice: Number(ticketPrice),
        capacity: Number(capacity),
        ticketsSold: 0,
        bannerImage: bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
        organizer: organizerId,
        createdAt: new Date()
      };

      mockDb.events.push(newEvent);

      return res.status(201).json({ success: true, data: newEvent });
    } else {
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
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateEvent = async (req, res) => {
  try {
    const isMock = process.env.USE_MOCK_DB === 'true';
    const eventId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (isMock) {
      const eventIndex = mockDb.events.findIndex((e) => e._id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const event = mockDb.events[eventIndex];

      // Make sure user is event organizer
      if (event.organizer !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
      }

      // Update fields
      const updatedEvent = {
        ...event,
        ...req.body,
        _id: eventId, // prevent changing ID
        organizer: event.organizer // prevent changing organizer
      };

      mockDb.events[eventIndex] = updatedEvent;

      return res.status(200).json({ success: true, data: updatedEvent });
    } else {
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
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    const isMock = process.env.USE_MOCK_DB === 'true';
    const eventId = req.params.id;
    const userId = req.user._id || req.user.id;

    if (isMock) {
      const eventIndex = mockDb.events.findIndex((e) => e._id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const event = mockDb.events[eventIndex];

      if (event.organizer !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
      }

      mockDb.events.splice(eventIndex, 1);
      
      mockDb.bookings = mockDb.bookings.filter(b => b.event !== eventId);

      return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } else {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      if (event.organizer.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
      }

      await event.deleteOne();

      return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
