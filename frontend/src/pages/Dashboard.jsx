import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Users, Calendar, Plus, X, BarChart3, PieChart, TrendingUp, Sparkles } from 'lucide-react';

const Dashboard = ({ user, token, backendUrl }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Event Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [ticketPrice, setTicketPrice] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerInputMode, setBannerInputMode] = useState('upload'); // 'upload' or 'url'
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreateBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError('File is too large. Max size is 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result);
    };
    reader.onerror = () => {
      setFormError('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${backendUrl}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to retrieve analytics.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Could not retrieve dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const response = await fetch(`${backendUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          date,
          time,
          location,
          ticketPrice: Number(ticketPrice),
          capacity: Number(capacity),
          bannerImage: bannerImage || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('Tech');
        setDate('');
        setTime('');
        setLocation('');
        setTicketPrice('0');
        setCapacity('100');
        setBannerImage('');
        setBannerInputMode('upload');
        // Refresh dashboard metrics
        fetchAnalytics();
      } else {
        setFormError(data.message || 'Failed to create event');
      }
    } catch (err) {
      console.error(err);
      setFormError('Server connection error. Failed to post event.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <span>Compiling organizer dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
        <p className="text-danger mb-4" style={{ fontSize: '1.1rem' }}>{error}</p>
        <button className="btn btn-outline" onClick={fetchAnalytics}>Try Again</button>
      </div>
    );
  }

  const { summary, categoryData, salesTrend, eventBreakdown } = analytics;

  // Custom Chart calculation variables
  const maxRevenue = salesTrend.length > 0 ? Math.max(...salesTrend.map(s => s.revenue), 100) : 100;

  return (
    <div className="fade-in-up">
      <div className="bg-glow-purple"></div>
      <div className="bg-glow-blue"></div>

      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Organizer Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your hosted listings, tracking revenues and check-in conversions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ height: '48px', borderRadius: '12px', padding: '0 1.5rem' }}
        >
          <Plus size={18} />
          <span>Create New Event</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="glass-card mb-6" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--surface-border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow for the profile card */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '150px',
          height: '150px',
          background: 'rgba(168, 85, 247, 0.15)',
          filter: 'blur(40px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
          zIndex: 1
        }}>
          {user?.name?.charAt(0).toUpperCase() || 'O'}
        </div>
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{user?.name || 'Organizer'}</h2>
            <span style={{
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.15rem 0.6rem',
              borderRadius: '20px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {user?.role || 'Organizer'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{user?.email || 'organizer@evently.com'}</p>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <p className="stat-val">${summary.totalRevenue.toLocaleString()}</p>
            <p className="stat-lbl">Total Gross Revenue</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
            <Ticket size={20} />
          </div>
          <div>
            <p className="stat-val">{summary.totalTicketsSold.toLocaleString()}</p>
            <p className="stat-lbl">Tickets Sold</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
            <Users size={20} />
          </div>
          <div>
            <p className="stat-val">{summary.attendanceRate}%</p>
            <p className="stat-lbl">QR Check-in Conversion</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Calendar size={20} />
          </div>
          <div>
            <p className="stat-val">{summary.activeEventsCount}</p>
            <p className="stat-lbl">Active Events</p>
          </div>
        </div>
      </div>

      {/* Custom Graphic Analytics Charts */}
      <div className="charts-grid">
        {/* Sales Trend Custom SVG Bar Chart */}
        <div className="glass-card">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
                <span>Revenue Sales Trend</span>
              </h3>
              <div className="chart-metric-summary">
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${salesTrend.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}
                </span>
                <span className="chart-trend-percent">
                  <TrendingUp size={12} />
                  <span>+14.2%</span>
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Past 7 Days</span>
            </span>
          </div>

          <div className="chart-container">
            {/* Y Axis Labels */}
            <div className="bar-chart-y-axis">
              <span>${Math.round(maxRevenue)}</span>
              <span>${Math.round(maxRevenue / 2)}</span>
              <span>$0</span>
            </div>

            {/* Bars plot */}
            <div className="bar-chart-plot">
              {salesTrend.length === 0 ? (
                <div style={{ position: 'absolute', top: '40%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No recent sales bookings recorded in this range.
                </div>
              ) : (
                salesTrend.map((item, idx) => {
                  const percent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="bar-chart-bar-wrapper">
                      <div
                        className="bar-chart-bar"
                        style={{ height: `${Math.max(percent, 4)}%` }}
                        title={`${item.date}: $${item.revenue} (${item.tickets} tickets)`}
                      ></div>
                    </div>
                  );
                })
              )}
            </div>

            {/* X Axis Date Labels */}
            <div className="bar-chart-x-axis">
              {salesTrend.map((item, idx) => (
                <span key={idx} style={{ flex: 1, textAlign: 'center' }}>{item.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Popularity Custom Pie representation */}
        <div className="glass-card">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={18} style={{ color: 'var(--secondary)' }} />
                <span>Category Share</span>
              </h3>
              <div className="chart-metric-summary">
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {categoryData.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Tickets</span>
              </div>
            </div>
          </div>

          <div className="flex-center" style={{ flexDirection: 'column', height: '220px', justifyContent: 'center' }}>
            {categoryData.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data registered</span>
            ) : (
              <div style={{ width: '100%' }}>
                {categoryData.map((item, idx) => {
                  const colors = ['#A855F7', '#06B6D4', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
                  const color = colors[idx % colors.length];
                  const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                  const sharePercent = total > 0 ? Math.round((item.value / total) * 100) : 0;

                  return (
                    <div key={item.name} className="flex-between mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></span>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>{item.value}</strong> ({sharePercent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events Table Listings breakdown */}
      <div className="glass-card">
        <h3 className="mb-4" style={{ fontSize: '1.4rem', letterSpacing: '-0.020em' }}>Event Performance Breakdown</h3>

        {eventBreakdown.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have not listed any events yet.</p>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(true)}>List First Event</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Event Title</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Tickets Sold / Capacity</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Occupancy Rate</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {eventBreakdown.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {item.ticketsSold} / {item.capacity}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                          <div style={{ height: '100%', background: 'var(--primary-gradient)', width: `${Math.min(item.occupancyRate, 100)}%`, borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '35px', color: 'var(--text-secondary)' }}>{item.occupancyRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      ${item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Event Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="modal-close"
            >
              ✕
            </button>

            <h3 className="mb-4" style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles className="text-primary" />
              <span>Create Event Listing</span>
            </h3>

            {formError && (
              <div className="glass-card mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.85rem' }}>{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. NextGen Web Conference"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Provide an engaging description of what attendees can expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="Music">Music</option>
                    <option value="Tech">Tech</option>
                    <option value="Arts">Arts</option>
                    <option value="Sports">Sports</option>
                    <option value="Food">Food</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Arena</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Silicon Valley Convention Hall"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ticket Price ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    placeholder="0 for Free"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Seating Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    placeholder="100"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`btn ${bannerInputMode === 'upload' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                  onClick={() => setBannerInputMode('upload')}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  className={`btn ${bannerInputMode === 'url' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                  onClick={() => setBannerInputMode('url')}
                >
                  Image URL
                </button>
              </div>

              {bannerInputMode === 'upload' ? (
                <div className="form-group mb-6">
                  <label className="form-label">Upload Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCreateBannerFileChange}
                    className="form-input"
                    style={{ padding: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Supported formats: JPEG, PNG, WEBP. Max size: 8MB.
                  </p>
                </div>
              ) : (
                <div className="form-group mb-6">
                  <label className="form-label">Banner Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={bannerImage && bannerImage.startsWith('data:') ? '' : bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                  />
                </div>
              )}

              {bannerImage && (
                <div className="mb-6">
                  <p className="form-label">Banner Preview</p>
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                    <img
                      src={bannerImage}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem' }}
                disabled={formLoading}
              >
                {formLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <span>Publish Experience Listing</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
