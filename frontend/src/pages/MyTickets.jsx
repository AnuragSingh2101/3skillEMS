import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Scan, CheckCircle, Info } from 'lucide-react';

const MyTickets = ({ token, backendUrl }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${backendUrl}/api/bookings/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setBookings(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch tickets.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Could not fetch tickets.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <span>Loading your tickets...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Background decorations */}
      <div className="bg-glow-purple"></div>
      
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>My Tickets</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and scan your entry passes for upcoming events</p>
        </div>
      </div>

      {error ? (
        <div className="glass-card text-center" style={{ padding: '3rem', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
          <p className="text-danger mb-4" style={{ fontSize: '1.1rem' }}>{error}</p>
          <button className="btn btn-outline" onClick={fetchMyBookings}>Try Again</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: '5rem 2rem' }}>
          <Ticket size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No tickets booked yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Browse through our events directory to book passes for concerts, conferences, art shows, and more.
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Events
          </Link>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => {
            const { _id, ticketQuantity, totalPrice, qrCodeUrl, checkedIn, checkedInAt, bookingDate, event } = booking;
            if (!event) return null;

            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div key={_id} className="ticket-card glass-card" style={{ background: 'rgba(15,15,20,0.85)', padding: 0 }}>
                {/* QR Code Section */}
                <div className="ticket-qr">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Entry Pass QR" />
                  ) : (
                    <div style={{ width: '120px', height: '120px', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span>QR Code</span>
                    </div>
                  )}
                </div>

                {/* Ticket Details Info */}
                <div className="ticket-info">
                  <div className="flex-between mb-4">
                    <span className={`badge badge-${(event.category || 'Other').toLowerCase()}`}>
                      {event.category || 'Other'}
                    </span>
                    
                    {checkedIn ? (
                      <span className="badge" style={{ background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} />
                        <span>Admitted</span>
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Scan size={12} />
                        <span>Active Pass</span>
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>
                    <Link to={`/event/${event._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {event.title}
                    </Link>
                  </h3>

                  <div className="card-info">
                    <Calendar size={14} />
                    <span>{eventDate} at {event.time}</span>
                  </div>

                  <div className="card-info">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--surface-border)', marginTop: '1rem', paddingTop: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
                      <p style={{ fontWeight: 600, color: '#fff' }}>{ticketQuantity} Ticket{ticketQuantity > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Total Paid</span>
                      <p style={{ fontWeight: 600, color: '#fff' }}>${totalPrice}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Booking ID</span>
                      <p style={{ fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {_id.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {checkedIn && checkedInAt && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>
                      <Info size={14} />
                      <span>Ticket scanned and checked in on {new Date(checkedInAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
