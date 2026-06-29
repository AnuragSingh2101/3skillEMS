import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';

const EventDetail = ({ user, token, backendUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checkout Modal State
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('***');
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${backendUrl}/api/events/${id}`);
      const data = await response.json();

      if (response.ok) {
        setEvent(data.data);
      } else {
        setError(data.message || 'Event not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Could not load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    if (quantity < (event.capacity - event.ticketsSold)) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const openCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    setPaymentError('');

    try {
      const response = await fetch(`${backendUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          ticketQuantity: quantity,
          paymentMethodId: 'pm_card_visa' // simulated payment card
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(data.data);
        // Refresh event details
        fetchEventDetails();
      } else {
        setPaymentError(data.message || 'Booking payment failed.');
      }
    } catch (err) {
      console.error(err);
      setPaymentError('Connection error during transaction. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <span>Loading event details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
        <p className="text-danger mb-4" style={{ fontSize: '1.1rem' }}>{error}</p>
        <Link to="/" className="btn btn-outline">
          <ArrowLeft size={16} />
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const ticketsLeft = event.capacity - event.ticketsSold;

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} />
          <span>Explore Events</span>
        </Link>
      </div>

      <div className="detail-hero">
        <img
          src={event.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80'}
          alt={event.title}
          className="detail-hero-img"
        />
        <div className="detail-hero-overlay">
          <span className={`badge badge-${event.category.toLowerCase()} mb-4`} style={{ width: 'fit-content', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {event.category}
          </span>
          <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '0.5rem' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} />
            <span>{eventDate} • {event.time}</span>
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Main Details column */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            About Event
          </h2>
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {event.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <MapPin size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Location</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{event.location}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <Calendar size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Date & Time</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{eventDate} at {event.time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing / Booking Column */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Get Tickets</h2>
          
          <div className="flex-between mb-4">
            <span style={{ color: 'var(--text-secondary)' }}>Ticket Price</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
            </span>
          </div>

          <div className="flex-between mb-6" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Users size={16} />
              <span>Availability</span>
            </span>
            <span style={{ fontWeight: 600, color: ticketsLeft <= 10 ? 'var(--danger)' : 'var(--success)' }}>
              {ticketsLeft === 0 ? 'Sold Out' : `${ticketsLeft} remaining`}
            </span>
          </div>

          {ticketsLeft > 0 ? (
            <>
              {(!user || user.role === 'attendee') ? (
                <>
                  <div className="flex-between mb-6">
                    <span style={{ fontWeight: 500 }}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '0.25rem 0.5rem', border: '1px solid var(--surface-border)' }}>
                      <button
                        onClick={handleDecrement}
                        className="btn btn-icon btn-outline"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', padding: 0 }}
                        disabled={quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                      <button
                        onClick={handleIncrement}
                        className="btn btn-icon btn-outline"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', padding: 0 }}
                        disabled={quantity >= ticketsLeft}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-between mb-6" style={{ borderTop: '1px dashed var(--surface-border)', paddingTop: '1rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Total Price</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${event.ticketPrice * quantity}
                    </span>
                  </div>

                  <button
                    onClick={openCheckout}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem' }}
                  >
                    <Ticket size={18} />
                    <span>Book {quantity} Ticket{quantity > 1 ? 's' : ''}</span>
                  </button>
                </>
              ) : (
                <div className="glass-card text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    You are logged in as an <strong>Organizer</strong>. Organizers cannot purchase tickets.
                  </p>
                </div>
              )}
            </>
          ) : (
            <button className="btn btn-outline" style={{ width: '100%', padding: '1rem' }} disabled>
              Sold Out
            </button>
          )}
        </div>
      </div>

      {/* Ticket Checkout Modal (Simulated Stripe Payment) */}
      {isCheckoutOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {!bookingSuccess ? (
              <>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="modal-close"
                >
                  ✕
                </button>
                
                <h3 className="mb-4" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard className="text-primary" />
                  <span>Secure Ticket Checkout</span>
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Complete your booking for <strong>{quantity}x {event.title}</strong>.
                </p>

                {paymentError && (
                  <div className="glass-card mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem 1rem' }}>
                    <p style={{ fontSize: '0.85rem' }}>{paymentError}</p>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit}>
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={user ? user.name : 'Sarah Connor'}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ letterSpacing: '0.05em' }}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                      <CreditCard size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Expires</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--success)', display: 'flex', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    <span>Simulated sandbox checkout enabled. No real charges will be made.</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.9rem' }}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <div className="spinner"></div>
                    ) : (
                      <span>Pay & Confirm — ${event.ticketPrice * quantity}</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center" style={{ padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <ShieldCheck size={32} />
                </div>
                
                <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Your payment was processed successfully. We've generated your secure tickets and check-in QR code.
                </p>

                <div className="glass-card text-center mb-6" style={{ background: 'white', padding: '1rem', width: '200px', margin: '0 auto' }}>
                  <img src={bookingSuccess.qrCodeUrl} alt="Booking QR" style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }} />
                </div>

                <div className="grid-2">
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      navigate('/my-tickets');
                    }}
                    className="btn btn-primary"
                  >
                    View My Tickets
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
