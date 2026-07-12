import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, RefreshCcw, BadgeCheck } from 'lucide-react';
import { getUserDisplayName } from '../api/authHelpers';
import { listMyOrders } from '../api/cart.api';
import { getApiErrorMessage } from '../utils/adminAuth';

const Account = () => {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const list = await listMyOrders();
        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) {
          setOrdersError(getApiErrorMessage(e, 'Could not load orders.'));
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = getUserDisplayName(user);
  const initial = (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'H').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="container" style={{ padding: '8rem 2rem', minHeight: '70vh' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem' }}>My Profile</h1>
        <button
          onClick={handleRefresh}
          className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-gold)',
            fontSize: '0.85rem',
          }}
        >
          <RefreshCcw size={16} />
          Refresh Info
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          padding: '3rem',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
          gap: '2rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            paddingRight: '2rem',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              backgroundColor: 'var(--color-charcoal)',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem',
            }}
          >
            {initial}
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{displayName}</h2>
          <span
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '4px 12px',
              backgroundColor: 'var(--color-ivory)',
              borderRadius: '20px',
              border: '1px solid var(--color-gold)',
            }}
          >
            {user?.role || 'customer'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-gold)' }}>
              <Mail size={18} />
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: '#888',
                  display: 'block',
                }}
              >
                Email Address
              </label>
              <span style={{ fontSize: '1rem' }}>{user?.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-gold)' }}>
              <BadgeCheck size={18} />
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: '#888',
                  display: 'block',
                }}
              >
                Email verified
              </label>
              <span style={{ fontSize: '1rem' }}>
                {user?.emailVerified ? 'Yes' : 'Not yet verified'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-gold)' }}>
              <Shield size={18} />
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: '#888',
                  display: 'block',
                }}
              >
                Account access
              </label>
              <span style={{ fontSize: '1rem' }}>
                {user?.isActive === false ? 'Inactive' : 'Active'} ·{' '}
                {user?.role || 'customer'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'var(--color-charcoal)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Sign Out
            </button>
            <button
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-charcoal)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: '3rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            marginBottom: '1.25rem',
          }}
        >
          Order history
        </h2>
        {ordersLoading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading orders…</p>
        ) : ordersError ? (
          <p style={{ color: '#a44', fontSize: '0.9rem' }}>{ordersError}</p>
        ) : orders.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No orders yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <li
                key={order.id}
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>#{order.id.slice(0, 8)}</strong>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#888' }}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : ''}{' '}
                    · {order.status}
                  </span>
                </div>
                <span style={{ fontWeight: 500 }}>{formatMoney(order.totalAmount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <style>{`
        .spinning {
          animation: spin 0.8s linear;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Account;
