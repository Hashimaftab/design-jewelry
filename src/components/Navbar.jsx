import { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BrandLogo from './BrandLogo';
import './Navbar.css';

const Navbar = () => {
  const { token } = useContext(AuthContext);
  const { cart, cartBounceKey } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBouncing, setIsBouncing] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '';

  useEffect(() => {
    if (cartBounceKey > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 950);
      return () => clearTimeout(timer);
    }
  }, [cartBounceKey]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <header className={`navbar-header ${isHome ? 'on-home' : 'on-other'}`}>
      <nav className="navbar-container">
    
        <div className="container nav-top-row">
          <div className="nav-brand-section">
            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="nav-logo" aria-label="HUSN Home">
              <BrandLogo isHome={isHome} className="nav-logo-img" />
            </Link>
          </div>

          <form className="nav-search-bar" onSubmit={handleSearchSubmit} role="search">
            <Search size={18} className="nav-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
              aria-label="Search"
            />
          </form>

          <div className="nav-actions">
            <button type="button" className="nav-action-btn wishlist-btn" aria-label="Wishlist" title="Wishlist">
              <Heart size={20} />
            </button>

            {token ? (
              <Link to="/account" className="nav-action-btn" aria-label="Account" title="My Account">
                <User size={20} />
              </Link>
            ) : (
              <Link to="/login" className="nav-action-btn" aria-label="Login" title="Sign In">
                <User size={20} />
              </Link>
            )}

            <Link
              to={token ? '/checkout' : '/login'}
              state={token ? undefined : { from: '/checkout' }}
              className={`nav-action-btn cart-btn ${isBouncing ? 'cart-btn--bouncing' : ''}`}
              aria-label="Shopping bag"
              title="Shopping Bag"
            >
              <ShoppingBag size={20} />
              {token && cart.itemCount > 0 ? (
                <span className="cart-count">
                  {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  {isBouncing && <span className="cart-count-ping" aria-hidden="true" />}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {/* Row 2: Categories Navigation Row */}
        <div className="nav-bottom-row">
          <div className="container nav-categories">
            <Link to="/collections/necklaces" className="nav-cat-link">Necklaces</Link>
            <Link to="/collections/earrings" className="nav-cat-link">Earrings</Link>
            <Link to="/collections/rings" className="nav-cat-link">Rings</Link>
            <Link to="/collections/bracelets" className="nav-cat-link">Bracelets</Link>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        <div className={`nav-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <form className="mobile-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
          </form>
          <div className="mobile-nav-links">
            <Link to="/collections/necklaces" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Necklaces</Link>
            <Link to="/collections/earrings" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Earrings</Link>
            <Link to="/collections/rings" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Rings</Link>
            <Link to="/collections/bracelets" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Bracelets</Link>
          </div>
          <div className="mobile-user-actions">
            {token ? (
              <Link to="/account" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} /> My Account
              </Link>
            ) : (
              <Link to="/login" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} /> Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
