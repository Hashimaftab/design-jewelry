import { useState, useContext } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Gem,
  Sparkles,
  Circle,
  Link2,
} from 'lucide-react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { getUserDisplayName } from '../../api/authHelpers';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';
import './AdminLayout.css';

const categoryIcon = {
  necklaces: Gem,
  earrings: Sparkles,
  rings: Circle,
  bracelets: Link2,
};

const AdminLayout = () => {
  const { user, logout } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categoryPathActive = (slug) => {
    const prefix = `/admin/products/${slug}`;
    const { pathname } = location;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__head">
          <span className="admin-sidebar__logo">HUSAN</span>
          <span className="admin-sidebar__tag">Console</span>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} aria-hidden />
            <span>Overview</span>
            <ChevronRight className="admin-nav-link__chev" size={14} strokeWidth={1.5} aria-hidden />
          </NavLink>

          <p className="admin-sidebar__section-label">Collections</p>
          {PRODUCT_CATEGORIES.map(({ slug, label }) => {
            const Icon = categoryIcon[slug] || Gem;
            return (
              <NavLink
                key={slug}
                to={`/admin/products/${slug}`}
                className={() =>
                  `admin-nav-link${categoryPathActive(slug) ? ' admin-nav-link--active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden />
                <span>{label}</span>
                <ChevronRight className="admin-nav-link__chev" size={14} strokeWidth={1.5} aria-hidden />
              </NavLink>
            );
          })}

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <ShoppingBag size={18} strokeWidth={1.5} aria-hidden />
            <span>Orders</span>
            <ChevronRight className="admin-nav-link__chev" size={14} strokeWidth={1.5} aria-hidden />
          </NavLink>
        </nav>

        <div className="admin-sidebar__user">
          <div className="admin-sidebar__user-meta">
            <span className="admin-sidebar__user-name">{getUserDisplayName(user) || 'Administrator'}</span>
            <span className="admin-sidebar__user-email">{user?.email}</span>
          </div>
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="admin-sidebar__scrim"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className={`admin-topbar__menu${!sidebarOpen ? ' admin-topbar__menu--show-sm' : ''}`}
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`admin-topbar__menu admin-topbar__menu--close${sidebarOpen ? ' admin-topbar__menu--show-sm' : ''}`}
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} strokeWidth={1.5} />
          </button>
          <div className="admin-topbar__title">
            <h1>Atelier operations</h1>
            <p>Inventory, fulfillment, and boutique performance</p>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
