import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { token } = useContext(AuthContext);
  const { cart } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/collections/necklaces" className="nav-link" onClick={() => setIsMenuOpen(false)}>Necklaces</Link>
          <Link to="/collections/earrings" className="nav-link" onClick={() => setIsMenuOpen(false)}>Earrings</Link>
          <Link to="/collections/rings" className="nav-link" onClick={() => setIsMenuOpen(false)}>Rings</Link>
          <Link to="/collections/bracelets" className="nav-link" onClick={() => setIsMenuOpen(false)}>Bracelets</Link>
        </div>
        
        <Link to="/" className="nav-logo">HUSAN</Link>
        
        <div className="nav-actions">
          <button aria-label="Search"><Search size={20} /></button>
          
          {token ? (
            <Link to="/account" aria-label="Account" title="My Account">
              <User size={20} />
            </Link>
          ) : (
            <Link to="/login" aria-label="Login" title="Sign In">
              <User size={20} />
            </Link>
          )}

          <Link
            to={token ? '/checkout' : '/login'}
            state={token ? undefined : { from: '/checkout' }}
            className="cart-btn"
            aria-label="Shopping bag"
          >
            <ShoppingBag size={20} />
            {token && cart.itemCount > 0 ? (
              <span className="cart-count">{cart.itemCount > 99 ? '99+' : cart.itemCount}</span>
            ) : null}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
