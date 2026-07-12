import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  // Render children if authenticated, otherwise redirect securely
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
