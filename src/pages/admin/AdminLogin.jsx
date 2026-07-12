import { ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login({ email, password });

    if (result.success) {
      navigate(from === '/admin/login' ? '/admin' : from, { replace: true });
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login__glow" aria-hidden />
      <div className="admin-login__panel">
        <Link to="/" className="admin-login__back">
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to boutique</span>
        </Link>

        <div className="admin-login__brand">
          <div className="admin-login__mark">
            <Lock size={22} strokeWidth={1.25} />
          </div>
          <p className="admin-login__house">HUSAN</p>
          <h1>Atelier console</h1>
          <p className="admin-login__subtitle">
            Secure access for curators and operations. Customer accounts cannot sign in here.
          </p>
        </div>

        {error ? <div className="admin-login__error" role="alert">{error}</div> : null}

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <label htmlFor="admin-email">Work email</label>
            <input
              id="admin-email"
              type="email"
              className="admin-login__input"
              placeholder="you@husan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="admin-login__field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="admin-login__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="admin-login__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying…' : 'Enter console'}
          </button>
        </form>

        <p className="admin-login__footnote">
          Protected area. All access is logged and audited.
        </p>
      </div>

      <div className="admin-login__visual" aria-hidden>
        <div className="admin-login__visual-inner">
          <span className="admin-login__visual-line" />
          <p className="admin-login__visual-quote">Crafted with intention.</p>
          <span className="admin-login__visual-line" />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
