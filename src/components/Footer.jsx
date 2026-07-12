import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h2 className="footer-logo">HUSAN</h2>
          <p>Elegance in every detail. Fine luxury jewelry crafted for the modern aesthetic.</p>
        </div>
        <div className="footer-links-group">
          <div className="footer-col">
            <h3>Shop</h3>
            <ul>
              <li><a href="/collections/necklaces">Necklaces</a></li>
              <li><a href="/collections/earrings">Earrings</a></li>
              <li><a href="#">Bracelets</a></li>
              <li><a href="#">Rings</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>About</h3>
            <ul>
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Journal</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Support</h3>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Shipping & Returns</a></li>
              <li><a href="#">Care Guide</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} HUSAN Jewelry. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
