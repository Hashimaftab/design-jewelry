import { ShoppingBag } from 'lucide-react';
import './AdminOrders.css';

const AdminOrders = () => (
  <div className="admin-orders">
    <header className="admin-orders__head">
      <h2>Orders</h2>
      <p>Track atelier shipments, returns, and bespoke commissions from one ledger.</p>
    </header>

    <div className="admin-orders__empty">
      <div className="admin-orders__empty-icon" aria-hidden>
        <ShoppingBag size={28} strokeWidth={1.25} />
      </div>
      <h3>No live orders yet</h3>
      <p>
        Wire your orders API to this view to unlock fulfillment status, payment state, and client
        notes. Admin sessions are already authenticated and isolated from customer tokens.
      </p>
    </div>
  </div>
);

export default AdminOrders;
