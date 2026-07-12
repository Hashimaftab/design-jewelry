import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import AdminPrivateRoute from './components/AdminPrivateRoute';
import AdminPublicRoute from './components/AdminPublicRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductList from './pages/admin/AdminProductList';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminProductView from './pages/admin/AdminProductView';
import AdminOrders from './pages/admin/AdminOrders';
import './App.css';

function App() {
  const location = useLocation();
  const hideNavbarFooter =
    ['/checkout', '/login', '/signup'].includes(location.pathname) ||
    location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/collections/:category" element={<Category />} />
          <Route path="/collections/:category/:productId" element={<ProductDetail />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/payments/:orderId" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/order-success/:orderId" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />

          {/* Auth Layout (Public Routes for unauthenticated users) */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />

          {/* Admin */}
          <Route
            path="/admin/login"
            element={
              <AdminPublicRoute>
                <AdminLogin />
              </AdminPublicRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminPrivateRoute>
                <AdminLayout />
              </AdminPrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<Navigate to="/admin/products/necklaces" replace />} />
            <Route path="products/:category/new" element={<AdminProductForm />} />
            <Route path="products/:category/:id/view" element={<AdminProductView />} />
            <Route path="products/:category/:id/edit" element={<AdminProductForm />} />
            <Route path="products/:category" element={<AdminProductList />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </main>
      {!hideNavbarFooter && <Footer />}
    </>
  );
}

export default App;
