import React, { useState, useEffect } from 'react';
import { Search, CalendarDays } from 'lucide-react';
import EventCard from '../components/EventCard';

const CATEGORIES = ['All', 'Music', 'Tech', 'Arts', 'Sports', 'Food', 'Business', 'Other'];

const Home = ({ backendUrl }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        queryParams.append('category', selectedCategory);
      }
      if (search) {
        queryParams.append('search', search);
      }

      const response = await fetch(`${backendUrl}/api/events?${queryParams.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Could not fetch events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  return (
    <div className="fade-in-up">
      {/* Decorative Glow elements */}
      <div className="bg-glow-purple"></div>
      <div className="bg-glow-blue"></div>

      {/* Hero Welcome banner */}
      <div className="explore-hero">
        <div className="explore-hero-badge">
          <CalendarDays size={14} />
          <span>Discover What's Happening</span>
        </div>
        <h1 className="explore-hero-heading">
          Discover Extraordinary Events
        </h1>
        <p className="explore-hero-subheading">
          Create events, reserve your seats, integrate payments, and scan tickets securely with our comprehensive event experience platform.
        </p>
        <div className="flex-center gap-4">
          <a href="#events-list" className="btn btn-primary" onClick={(e) => {
            e.preventDefault();
            document.getElementById('events-list')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Explore Events
          </a>
          <a href="#events-list" className="btn btn-outline" onClick={(e) => {
            e.preventDefault();
            document.getElementById('events-list')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Learn More
          </a>
        </div>
        <div className="explore-hero-divider"></div>
      </div>

      {/* Search and Filters */}
      <div id="events-list" className="filter-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search events by title, description or location..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="category-tags">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-tag ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Results Grid */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>Loading experiences...</span>
        </div>
      ) : error ? (
        <div className="glass-card text-center" style={{ padding: '3rem', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
          <p className="text-danger mb-4" style={{ fontSize: '1.1rem' }}>{error}</p>
          <button className="btn btn-outline" onClick={fetchEvents}>Try Again</button>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
          <CalendarDays size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No events found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            We couldn't find any events matching your criteria. Try adjusting your keywords or category filter.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedCategory('All');
              setSearch('');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
