import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { token, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  // Render children if authenticated, otherwise redirect securely
  return token ? children : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
};

export default PrivateRoute;
