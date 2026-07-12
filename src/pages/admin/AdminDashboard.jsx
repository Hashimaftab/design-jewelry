import { Sparkles, Package, TrendingUp, Users } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const cards = [
    {
      label: 'Catalog',
      value: 'Live',
      hint: 'Products are managed via the API per category',
      icon: Package,
    },
    {
      label: 'Collections',
      value: '4',
      hint: 'Necklaces, earrings, rings, bracelets',
      icon: Sparkles,
    },
    {
      label: 'Storefront',
      value: 'Public API',
      hint: 'Customers browse /products/{category}',
      icon: TrendingUp,
    },
    {
      label: 'Client accounts',
      value: '—',
      hint: 'Customer auth available at /auth/login',
      icon: Users,
    },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__intro">
        <h2>Overview</h2>
        <p>A single glance at catalog health and operational signals.</p>
      </header>

      <div className="admin-dashboard__grid">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <article key={label} className="admin-stat-card">
            <div className="admin-stat-card__icon" aria-hidden>
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <p className="admin-stat-card__label">{label}</p>
            <p className="admin-stat-card__value">{value}</p>
            <p className="admin-stat-card__hint">{hint}</p>
          </article>
        ))}
      </div>

      <section className="admin-dashboard__panel">
        <h3>Today</h3>
        <p>
          Manage inventory under Products in the sidebar. Changes sync to the public storefront when
          products are marked available in admin.
        </p>
      </section>
    </div>
  );
};

export default AdminDashboard;
