import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContextValue';
import BrandLogo from '../components/BrandLogo';
import { useLanguage } from '../context/LanguageContextValue';

const Login = () => {
  const { t } = useLanguage();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination = typeof from === 'string' ? from : from?.pathname;
  const redirectTo = destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/account';
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
      navigate(redirectTo, { replace: true });
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
          <h2>{t('auth.welcomeBack')}</h2>
          <p>{t('auth.loginIntro')}</p>
        </div>
        
        {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
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
            <div className="label-row">
              <label htmlFor="password">{t('auth.password')}</label>
              <a href="#" className="forgot-password">{t('auth.forgotPassword')}</a>
            </div>
            <input 
              type="password" 
              id="password" 
              className="form-input" 
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
        
        <p className="auth-footer">
          {t('auth.noAccount')} <Link to="/signup" className="auth-link">{t('auth.createAccount')}</Link>
        </p>
      </div>
      <div className="auth-image" style={{ backgroundImage: `url('/shop_look.png')` }}></div>
    </div>
  );
};
export default Login;
