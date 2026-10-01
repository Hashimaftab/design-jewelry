import BrandLogo from './BrandLogo';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContextValue';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <BrandLogo variant="dark" className="footer-logo-img" />
          <p>{t('footer.tagline')}</p>
        </div>
        <div className="footer-links-group">
          <div className="footer-col">
            <h3>{t('footer.shop')}</h3>
            <ul>
              <li><a href="/collections/necklaces">{t('category.necklaces')}</a></li>
              <li><a href="/collections/earrings">{t('category.earrings')}</a></li>
              <li><a href="/collections/bracelets">{t('category.bracelets')}</a></li>
              <li><a href="/collections/rings">{t('category.rings')}</a></li>
              <li><a href="/collections/gifts">{t('category.gifts')}</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>{t('footer.support')}</h3>
            <ul>
              <li><a href="#">{t('footer.contact')}</a></li>
              <li><Link to="/shipping-policy">{t('footer.shippingPolicy')}</Link></li>
              <li><Link to="/return-policy">{t('footer.returnPolicy')}</Link></li>
              <li><Link to="/terms-of-service">{t('footer.termsOfService')}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>{t('footer.legal')}</h3>
            <ul>
              <li><Link to="/privacy-policy">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/legal-notice">{t('footer.legalNotice')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} HUSAN Jewelry. {t('footer.rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
