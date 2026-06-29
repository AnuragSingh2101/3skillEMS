const bcrypt = require('bcryptjs');

// Seed Users
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync('password123', salt);

const mockUsers = [
  {
    _id: 'user_org_1',
    name: 'Sarah Connor',
    email: 'organizer@evently.com',
    password: hashedPassword,
    role: 'organizer',
    createdAt: new Date()
  },
  {
    _id: 'user_att_1',
    name: 'John Doe',
    email: 'attendee@evently.com',
    password: hashedPassword,
    role: 'attendee',
    createdAt: new Date()
  }
];

// Seed Events
const mockEvents = [
  {
    _id: 'event_1',
    title: 'Neon Pulse: Synthwave Night',
    description: 'Immerse yourself in a retro-futuristic audio-visual journey. Featuring top synthwave artists, stunning laser shows, and immersive retro arcade setups.',
    category: 'Music',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
    time: '20:00',
    location: 'Cyber Arena, Los Angeles',
    ticketPrice: 45,
    capacity: 200,
    ticketsSold: 120,
    bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    organizer: 'user_org_1',
    createdAt: new Date()
  },
  {
    _id: 'event_2',
    title: 'Future Tech Summit 2026',
    description: 'Discover the next era of computing. Keynote presentations on Quantum Computing, AI Agents, Neural Interfaces, and Web3 from industry-leading innovators.',
    category: 'Tech',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
    time: '09:00',
    location: 'Silicon Valley Convention Center, San Jose',
    ticketPrice: 299,
    capacity: 500,
    ticketsSold: 340,
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    organizer: 'user_org_1',
    createdAt: new Date()
  },
  {
    _id: 'event_3',
    title: 'Metropolitan Art Exhibition',
    description: 'Experience an curated collection of digital art, physical sculptures, and interactive installations exploring the relationship between humans and artificial intelligence.',
    category: 'Arts',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days in future
    time: '11:00',
    location: 'Metropolitan Gallery, New York',
    ticketPrice: 15,
    capacity: 100,
    ticketsSold: 85,
    bannerImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
    organizer: 'user_org_1',
    createdAt: new Date()
  }
];

// Seed Bookings
const mockBookings = [
  {
    _id: 'booking_1',
    event: 'event_1',
    user: 'user_att_1',
    ticketQuantity: 2,
    totalPrice: 90,
    paymentStatus: 'paid',
    paymentId: 'ch_mock_123',
    qrCodeUrl: 'mock-qr-booking_1',
    checkedIn: false,
    checkedInAt: null,
    bookingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'booking_2',
    event: 'event_2',
    user: 'user_att_1',
    ticketQuantity: 1,
    totalPrice: 299,
    paymentStatus: 'paid',
    paymentId: 'ch_mock_456',
    qrCodeUrl: 'mock-qr-booking_2',
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

const mockDb = {
  users: mockUsers,
  events: mockEvents,
  bookings: mockBookings
};

module.exports = mockDb;
