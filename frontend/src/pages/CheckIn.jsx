import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, ShieldAlert, CheckCircle, AlertTriangle, Key } from 'lucide-react';

const CheckIn = ({ backendUrl }) => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [manualBookingId, setManualBookingId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '', details?: any }

  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Camera scan only
      },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.warn('Error clearing html5-qrcode scanner:', err);
        });
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    try {
      // The QR code contains stringified JSON: { bookingId, eventId, ticketQuantity, userName }
      const parsedData = JSON.parse(decodedText);
      if (parsedData && parsedData.bookingId) {
        // Automatically check-in booking
        await handleCheckIn(parsedData.bookingId);
      } else {
        setScanError('Invalid QR format. Could not locate booking identifier.');
      }
    } catch (e) {
      // Fallback: Check if decodedText itself is just a booking ID
      if (decodedText && decodedText.length > 5) {
        await handleCheckIn(decodedText);
      } else {
        setScanError('Failed to decode scanned QR text: ' + decodedText);
      }
    }
  };

  const onScanFailure = (error) => {
    // This callback triggers frequently for every frame where no QR code is found
    // We suppress logging to avoid flooding the console
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualBookingId.trim()) return;
    await handleCheckIn(manualBookingId.trim());
  };

  const handleCheckIn = async (bookingId) => {
    setVerifying(true);
    setMessage(null);
    setScanError('');

    try {
      const response = await fetch(`${backendUrl}/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Check-in successful!',
          details: data.data
        });
        // Clear manual input
        setManualBookingId('');
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Check-in validation failed.'
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'API server error. Check connection settings.'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="bg-glow-purple"></div>

      <div className="text-center mb-6">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>QR Ticket Verification</h1>
        <p style={{ color: 'var(--text-muted)' }}>Scan attendee passes via device camera or verify bookings manually</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Side: Scan verification status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(168, 85, 247, 0.08)' }}>
            <h2 className="mb-4" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.020em' }}>
              <Scan className="text-primary" size={20} />
              <span>Scanner Console</span>
            </h2>

            {/* Camera feed canvas placeholder wrapper */}
            <div className="scanner-console-viewfinder mb-2">
              {/* Corner brackets overlay */}
              <div style={{ position: 'absolute', top: 12, left: 12, borderTop: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', width: 20, height: 20, zIndex: 15, borderRadius: '4px 0 0 0', filter: 'drop-shadow(0 0 4px var(--primary))' }}></div>
              <div style={{ position: 'absolute', top: 12, right: 12, borderTop: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', width: 20, height: 20, zIndex: 15, borderRadius: '0 4px 0 0', filter: 'drop-shadow(0 0 4px var(--primary))' }}></div>
              <div style={{ position: 'absolute', bottom: 12, left: 12, borderBottom: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', width: 20, height: 20, zIndex: 15, borderRadius: '0 0 0 4px', filter: 'drop-shadow(0 0 4px var(--primary))' }}></div>
              <div style={{ position: 'absolute', bottom: 12, right: 12, borderBottom: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', width: 20, height: 20, zIndex: 15, borderRadius: '0 0 4px 0', filter: 'drop-shadow(0 0 4px var(--primary))' }}></div>
              
              {/* Scan line indicator */}
              <div className="scan-line"></div>
              
              <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>
            </div>

            {scanError && (
              <p className="text-danger mt-4" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} />
                <span>{scanError}</span>
              </p>
            )}
          </div>

          <div className="glass-card">
            <h3 className="mb-4" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.020em' }}>
              <Key size={18} style={{ color: 'var(--secondary)' }} />
              <span>Manual Check-in Bypass</span>
            </h3>
            
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Paste Ticket / Booking ID here..."
                value={manualBookingId}
                onChange={(e) => setManualBookingId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={verifying || !manualBookingId.trim()}
                style={{ height: '42px', borderRadius: '10px' }}
              >
                Verify
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Scan Status Feedback Output */}
        <div className="glass-card text-center" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {verifying ? (
            <div>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem auto' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Verifying booking signature...</p>
            </div>
          ) : message ? (
            <div style={{ animation: 'fadeInUp 0.35s ease' }}>
              {message.type === 'success' ? (
                <>
                  <div className="status-badge-pulse" style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-success mb-4" style={{ fontSize: '1.6rem', letterSpacing: '-0.030em' }}>Access Granted</h3>
                  
                  {message.details && (
                    <div className="glass-card text-left" style={{ background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '20px' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Attendee Name: <strong style={{ color: 'var(--text-primary)' }}>{message.details.attendeeName}</strong>
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Event Title: <strong style={{ color: 'var(--text-primary)' }}>{message.details.eventTitle}</strong>
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Checked In At: <strong style={{ color: 'var(--text-primary)' }}>{new Date(message.details.checkedInAt).toLocaleTimeString()}</strong>
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted-secondary)', fontFamily: 'monospace' }}>
                        ID: {message.details.bookingId}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-danger mb-4" style={{ fontSize: '1.6rem', letterSpacing: '-0.030em' }}>Access Denied</h3>
                  <div className="glass-card" style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.15)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {message.text}
                  </div>
                </>
              )}

              <button
                onClick={() => setMessage(null)}
                className="btn btn-outline mt-6"
                style={{ fontSize: '0.85rem', borderRadius: '8px' }}
              >
                Scan Next Ticket
              </button>
            </div>
          ) : (
            <div className="flex-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              <div className="status-badge-pulse" style={{ display: 'inline-flex', padding: '1px', borderRadius: '20px', background: 'var(--primary-gradient)', marginBottom: '0.5rem' }}>
                <div style={{ background: 'var(--bg-color)', padding: '0.4rem 1.25rem', borderRadius: '19px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', transition: 'background-color 0.3s ease' }}>
                  Awaiting Scan
                </div>
              </div>
              
              <Scan className="status-badge-pulse" size={42} style={{ color: 'var(--primary)', opacity: 0.8, marginBottom: '0.25rem' }} />
              
              <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', letterSpacing: '-0.020em' }}>Ready to Scan</h3>
              <p style={{ maxWidth: '320px', color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                Position a ticket QR code inside the camera viewfinder to instantly verify admission.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
