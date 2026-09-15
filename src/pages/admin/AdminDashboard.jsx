import { formatStorePrice as formatCurrency } from '../../utils/currency';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Package, ShoppingBag, Clock, Euro, ChevronRight } from 'lucide-react';
import { ordersApi } from '../../api/ordersApiClient';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    delivered_orders: 0,
    total_revenue: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let isMounted = true;
    ordersApi
      .getAdminOrders({ limit: 1 })
      .then((res) => {
        if (isMounted && res?.data?.statistics) {
          setStats(res.data.statistics);
        }
      })
      .catch(() => {
        // graceful ignore if server is not reachable
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    {
      label: 'Fulfillment',
      value: loadingOrders ? '—' : `${stats.pending_orders} Pending`,
      hint: `${stats.total_orders} total orders recorded`,
      icon: Clock,
      link: '/admin/orders',
    },
    {
      label: 'Atelier Revenue',
      value: loadingOrders ? '—' : formatCurrency(stats.total_revenue),
      hint: `${stats.delivered_orders} orders successfully delivered`,
      icon: Euro,
      link: '/admin/orders',
    },
    {
      label: 'Collections',
      value: '4',
      hint: 'Necklaces, earrings, rings, bracelets',
      icon: Sparkles,
      link: '/admin/products/necklaces',
    },
    {
      label: 'Inventory',
      value: 'Live',
      hint: 'Products synced to storefront',
      icon: Package,
      link: '/admin/products/necklaces',
    },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__intro">
        <div className="admin-eyebrow"><Sparkles size={14} />Atelier Overview</div>
        <h2>Overview</h2>
        <p>A single glance at catalog health, customer orders, and fulfillment signals.</p>
      </header>

      <div className="admin-dashboard__grid">
        {cards.map(({ label, value, hint, icon: Icon, link }) => (
          <Link
            key={label}
            to={link}
            className="admin-stat-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="admin-stat-card__icon" aria-hidden>
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <p className="admin-stat-card__label">{label}</p>
            <p className="admin-stat-card__value">{value}</p>
            <p className="admin-stat-card__hint">{hint}</p>
          </Link>
        ))}
      </div>

      <section className="admin-dashboard__panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3>Fulfillment & Shipping</h3>
            <p>
              Process client orders, update shipping states to Delivered, and review bespoke commission requests.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="admin-primary-link"
          >
            <ShoppingBag size={15} />
            <span>Open Orders Ledger</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
