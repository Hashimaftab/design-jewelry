import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { getOrderCustomerName, getOrderLabel } from '../../utils/adminOrderHelpers';
import './ShipmentEmailDialog.css';

export default function ShipmentEmailDialog({ order, busy, error, onCancel, onSend }) {
  const dialog = useRef(null);
  const submitting = useRef(false);
  const recipient = order.contact?.email || order.customer?.email || '';
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [subject, setSubject] = useState(`Your HUSN order ${getOrderLabel(order)} has been shipped`);
  const [message, setMessage] = useState(`Hello ${getOrderCustomerName(order)},\n\nYour order has been shipped and is on its way to you.`);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || busy || !recipient) return;
    submitting.current = true;
    try { await onSend({ trackingNumber: trackingNumber.trim(), courier: courier.trim(), subject: subject.trim(), message: message.trim() }); }
    finally { submitting.current = false; }
  };

  return createPortal(
    <dialog ref={dialog} className="shipment-email" aria-labelledby="shipment-email-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
      <form onSubmit={submit}>
        <header className="shipment-email__header">
          <div><h2 id="shipment-email-title">Shipping notification</h2><p>{getOrderLabel(order)}</p></div>
          <button type="button" aria-label="Close shipping email" onClick={onCancel} disabled={busy}><X size={22} /></button>
        </header>
        <div className="shipment-email__body">
          <label>To<input value={recipient} readOnly type="email" /></label>
          {!recipient && <p role="alert">This order has no customer email address. A shipping email cannot be sent.</p>}
          <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} disabled={busy} /></label>
          <div className="shipment-email__fields">
            <label>Tracking ID number<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} required maxLength={120} disabled={busy} autoFocus /></label>
            <label>Courier service<input value={courier} onChange={(event) => setCourier(event.target.value)} required maxLength={120} disabled={busy} /></label>
          </div>
          <label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={5000} rows={5} disabled={busy} /></label>
          <section className="shipment-email__preview" aria-label="Shipment details in email">
            <p>Your tracking ID number is: <strong>{trackingNumber.trim() || '—'}</strong></p>
            <p>Courier service: <strong>{courier.trim() || '—'}</strong></p>
          </section>
          <p className="shipment-email__hint">These shipment details and the order summary will be included in the email. The order stays unchanged until you send.</p>
          {error && <p className="shipment-email__error" role="alert">{error}</p>}
        </div>
        <footer className="shipment-email__footer">
          <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="shipment-email__send" type="submit" disabled={busy || !recipient || !trackingNumber.trim() || !courier.trim() || !subject.trim() || !message.trim()}><Send size={16} />{busy ? 'Sending…' : 'Send email & mark shipped'}</button>
        </footer>
      </form>
    </dialog>, document.body,
  );
}
