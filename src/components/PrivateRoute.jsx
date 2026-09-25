import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';
import { useLanguage } from '../context/LanguageContextValue';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { token, loading } = useContext(AuthContext);
  const { t } = useLanguage();

  if (loading) return <div>{t('common.loading')}</div>;

  // Render children if authenticated, otherwise redirect securely
  return token ? children : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
};

export default PrivateRoute;
