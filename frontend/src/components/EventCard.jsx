import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventCard = ({ event }) => {
  const { _id, title, category, date, time, location, ticketPrice, capacity, ticketsSold, bannerImage } = event;
  
  const eventDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const categoryBadgeClass = `badge badge-${category.toLowerCase()}`;
  const ticketsLeft = capacity - ticketsSold;

  return (
    <div className="glass-card event-card">
      <div className="card-img-container">
        <img
          src={bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80'}
          alt={title}
          className="card-img"
        />
        <div className="card-category">
          <span className={categoryBadgeClass}>{category}</span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="mb-4">
          <Link to={`/event/${_id}`} className="card-title">
            {title}
          </Link>
        </h3>

        <div className="card-info">
          <Calendar size={14} />
          <span>{eventDate} • {time}</span>
        </div>

        <div className="card-info">
          <MapPin size={14} />
          <span>{location}</span>
        </div>

        <div className="card-info mb-6">
          <Users size={14} />
          <span style={{ color: ticketsLeft <= 10 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {ticketsLeft === 0 ? 'Sold Out' : `${ticketsLeft} tickets remaining`}
          </span>
        </div>

        <div className="card-footer">
          <span className="card-price">
            {ticketPrice === 0 ? 'Free' : `$${ticketPrice}`}
          </span>
          <Link to={`/event/${_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
