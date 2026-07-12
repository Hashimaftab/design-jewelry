import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminPublicRoute = ({ children }) => {
  const { token, loading, isAdmin } = useContext(AdminAuthContext);

  if (loading) {
    return (
      <div className="admin-route-loading" aria-busy="true">
        <span className="admin-route-loading__dot" />
      </div>
    );
  }

  if (token && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminPublicRoute;
