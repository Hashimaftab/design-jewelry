import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminPrivateRoute = ({ children }) => {
  const { token, loading, isAdmin } = useContext(AdminAuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-route-loading" aria-busy="true">
        <span className="admin-route-loading__dot" />
      </div>
    );
  }

  if (!token || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default AdminPrivateRoute;
