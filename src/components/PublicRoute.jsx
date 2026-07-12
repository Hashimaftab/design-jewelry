import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  // Redirect to the account page if already logged in!
  return !token ? children : <Navigate to="/account" replace />;
};

export default PublicRoute;
