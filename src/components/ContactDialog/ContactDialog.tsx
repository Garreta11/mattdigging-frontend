import React, { useState, useEffect, useRef } from 'react';
import './ContactDialog.scss';

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

const ContactDialog: React.FC<ContactDialogProps> = ({ isOpen, onClose, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setSubject('');
      setMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `From: ${email}\n\n${message}`
    );
    const subjectEncoded = encodeURIComponent(subject);
    window.location.href = `mailto:mattdigging@gmx.de?subject=${subjectEncoded}&body=${body}`;
    setSubmitted(true);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="contact-dialog-overlay" onClick={handleOverlayClick}>
      <div className="contact-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
        <div className="contact-dialog__header">
          <div className="contact-dialog__header__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="contact-dialog__title" id="contact-dialog-title">Any Questions / Feedback?</h2>
            <p className="contact-dialog__subtitle">We'd love to hear from you</p>
          </div>
          <button className="contact-dialog__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="contact-dialog__success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>Your email client has been opened with the message pre-filled. Just hit send!</p>
            <button className="contact-dialog__success__btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="contact-dialog__form" onSubmit={handleSubmit}>
            <div className="contact-dialog__field">
              <label htmlFor="contact-email">Your Email</label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="contact-dialog__field">
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's on your mind?"
                required
              />
            </div>

            <div className="contact-dialog__field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us anything — feedback, questions, suggestions..."
                rows={5}
                required
              />
            </div>

            <button type="submit" className="contact-dialog__submit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactDialog;
