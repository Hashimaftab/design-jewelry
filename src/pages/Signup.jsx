import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContextValue';
import BrandLogo from '../components/BrandLogo';
import { useLanguage } from '../context/LanguageContextValue';

const Signup = () => {
  const { t } = useLanguage();
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordWeak'));
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      email,
      password,
      firstName,
      lastName,
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          <span>{t('common.backToStore')}</span>
        </Link>
        <div className="auth-header">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <BrandLogo
              variant="dark"
              className="auth-logo-img"
            />
          </Link>
          <h2>{t('auth.createAccount')}</h2>
          <p>{t('auth.createIntro')}</p>
        </div>

        {error && (
          <div
            className="auth-error"
            style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}
          >
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="firstName">{t('auth.firstName')}</label>
              <input
                type="text"
                id="firstName"
                className="form-input"
                placeholder={t('auth.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="lastName">{t('auth.lastName')}</label>
              <input
                type="text"
                id="lastName"
                className="form-input"
                placeholder={t('auth.lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder={t('auth.passwordRule')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? t('auth.creating') : t('auth.createAccount')}
          </button>
        </form>

        <p className="auth-footer">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="auth-link">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
      <div
        className="auth-image"
        style={{ backgroundImage: `url('/hero_bg.png')`, backgroundPosition: 'left center' }}
      ></div>
    </div>
  );
};

export default Signup;
