const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Music', 'Tech', 'Arts', 'Sports', 'Food', 'Business', 'Other']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  time: {
    type: String,
    required: [true, 'Please add a time']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Please add a ticket price'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Please add capacity (number of seats)'],
    min: [1, 'Capacity must be at least 1']
  },
  ticketsSold: {
    type: Number,
    default: 0
  },
  bannerImage: {
    type: String,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
