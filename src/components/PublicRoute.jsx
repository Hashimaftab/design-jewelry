import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';
import { useLanguage } from '../context/LanguageContextValue';

const PublicRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  const { t } = useLanguage();

  if (loading) return <div>{t('common.loading')}</div>;

  // Redirect to the account page if already logged in!
  return !token ? children : <Navigate to="/account" replace />;
};

export default PublicRoute;
