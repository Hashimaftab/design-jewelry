import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContextValue';
import { useCart } from '../context/CartContextValue';
import BrandLogo from './BrandLogo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContextValue';
import './Navbar.css';

const Navbar = () => {
  const { token } = useContext(AuthContext);
  const { cart, cartBounceKey } = useCart();
  const [menuPath, setMenuPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isHome = location.pathname === '/' || location.pathname === '';

  const isMenuOpen = menuPath === location.pathname;
  const toggleMenu = () => setMenuPath(isMenuOpen ? null : location.pathname);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const category = location.pathname.match(/^\/collections\/([^/]+)/)?.[1] || 'necklaces';
    navigate('/collections/' + category + '?search=' + encodeURIComponent(searchQuery.trim()));
    setMenuPath(null);
  };

  return (
    <header className={`navbar-header ${isHome ? 'on-home' : 'on-other'}`}>
      <nav className="navbar-container">
    
        <div className="container nav-top-row">
          <div className="nav-brand-section">
            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label={t('nav.toggleMenu')}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="nav-logo" aria-label={t('nav.home')}>
              <BrandLogo isHome={isHome} className="nav-logo-img" />
            </Link>
          </div>

          <form className="nav-search-bar" onSubmit={handleSearchSubmit} role="search">
            <Search size={18} className="nav-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder={t('nav.search')} aria-label={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
          </form>

          <div className="nav-actions">
            <LanguageSwitcher />
            <button type="button" className="nav-action-btn wishlist-btn" aria-label={t('nav.wishlist')} title={t('nav.wishlist')}>
              <Heart size={20} />
            </button>

            {token ? (
              <Link to="/account" className="nav-action-btn" aria-label={t('nav.account')} title={t('nav.account')}>
                <User size={20} />
              </Link>
            ) : (
              <Link to="/login" className="nav-action-btn" aria-label={t('nav.login')} title={t('nav.signIn')}>
                <User size={20} />
              </Link>
            )}

            <Link
              to="/checkout"
              key={cartBounceKey}
              className={`nav-action-btn cart-btn ${cartBounceKey > 0 ? 'cart-btn--bouncing' : ''}`}
              aria-label={t('nav.shoppingBag')}
              title={t('nav.shoppingBag')}
            >
              <ShoppingBag size={20} />
              {cart.itemCount > 0 ? (
                <span className="cart-count">
                  {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  {cartBounceKey > 0 && <span className="cart-count-ping" aria-hidden="true" />}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {/* Row 2: Categories Navigation Row */}
        <div className="nav-bottom-row">
          <div className="container nav-categories">
            <Link to="/collections/necklaces" className="nav-cat-link">{t('category.necklaces')}</Link>
            <Link to="/collections/earrings" className="nav-cat-link">{t('category.earrings')}</Link>
            <Link to="/collections/rings" className="nav-cat-link">{t('category.rings')}</Link>
            <Link to="/collections/bracelets" className="nav-cat-link">{t('category.bracelets')}</Link>
            <Link to="/collections/gifts" className="nav-cat-link">{t('category.gifts')}</Link>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        <div id="mobile-navigation" inert={!isMenuOpen} onKeyDown={(event) => { if (event.key === 'Escape') setMenuPath(null); }} className={`nav-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <form className="mobile-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="nav-search-icon" />
            <input
              type="text"
              placeholder={t('nav.search')}
              aria-label={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
          </form>
          <div className="mobile-nav-links">
            <Link to="/collections/necklaces" className="mobile-nav-link" onClick={() => setMenuPath(null)}>{t('category.necklaces')}</Link>
            <Link to="/collections/earrings" className="mobile-nav-link" onClick={() => setMenuPath(null)}>{t('category.earrings')}</Link>
            <Link to="/collections/rings" className="mobile-nav-link" onClick={() => setMenuPath(null)}>{t('category.rings')}</Link>
            <Link to="/collections/bracelets" className="mobile-nav-link" onClick={() => setMenuPath(null)}>{t('category.bracelets')}</Link>
            <Link to="/collections/gifts" className="mobile-nav-link" onClick={() => setMenuPath(null)}>{t('category.gifts')}</Link>
          </div>
          <div className="mobile-user-actions">
            {token ? (
              <Link to="/account" className="mobile-user-link" onClick={() => setMenuPath(null)}>
                <User size={18} /> {t('nav.account')}
              </Link>
            ) : (
              <Link to="/login" className="mobile-user-link" onClick={() => setMenuPath(null)}>
                <User size={18} /> {t('nav.signIn')}
              </Link>
            )}
          </div>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
