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
          backgroundColor: '#ffffff',
          padding: '3rem',
          border: '1px solid var(--border-gold)',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), var(--gold-glow-soft)',
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
          gap: '2.5rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderRight: '1px solid rgba(212, 175, 55, 0.15)',
            paddingRight: '2rem',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              background: 'var(--gold-gradient)',
              color: '#0b0c10',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 700,
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)',
            }}
          >
            {initial}
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#111827', fontFamily: 'var(--font-serif)' }}>{displayName}</h2>
          <span
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              padding: '5px 16px',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderRadius: '20px',
              border: '1px solid var(--border-gold)',
              color: 'var(--gold-light)',
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

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.85rem 2.2rem',
                backgroundColor: '#211b17',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#211b17';
              }}
            >
              Sign Out
            </button>
            <button
              style={{
                padding: '0.8rem 2.2rem',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: '6px',
                color: 'var(--gold-light)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: '3.5rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.85rem',
            marginBottom: '1.5rem',
            color: '#111827',
            letterSpacing: '0.02em',
          }}
        >
          Order History
        </h2>
        {ordersLoading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading orders…</p>
        ) : ordersError ? (
          <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{ordersError}</p>
        ) : orders.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed var(--border-gold)',
            }}
          >
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No orders yet.</p>
            <button
              onClick={() => navigate('/collections/necklaces')}
              style={{
                backgroundColor: '#211b17',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.8rem 1.8rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#211b17';
              }}
            >
              Explore Collections
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
            {orders.map((order) => (
              <li
                key={order.id}
                style={{
                  background: '#ffffff',
                  padding: '1.25rem 1.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-gold)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--gold-primary)', letterSpacing: '0.05em' }}>
                    #{order.id.slice(0, 8)}
                  </strong>
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                  </span>
                  <span
                    style={{
                      marginLeft: '0.75rem',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      padding: '3px 12px',
                      borderRadius: '12px',
                      backgroundColor:
                        order.status === 'paid'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(212, 175, 55, 0.12)',
                      color:
                        order.status === 'paid'
                          ? '#059669'
                          : 'var(--gold-primary)',
                      border: `1px solid ${
                        order.status === 'paid'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(212, 175, 55, 0.3)'
                      }`,
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--gold-primary)' }}>
                  {formatMoney(order.totalAmount)}
                </span>
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
