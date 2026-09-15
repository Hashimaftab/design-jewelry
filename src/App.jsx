import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import AdminPrivateRoute from './components/AdminPrivateRoute';
import AdminPublicRoute from './components/AdminPublicRoute';

import CartToast from './components/CartToast';
import './App.css';

const Category = lazy(() => import('./pages/Category'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Account = lazy(() => import('./pages/Account'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductList = lazy(() => import('./pages/admin/AdminProductList'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminProductView = lazy(() => import('./pages/admin/AdminProductView'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));

function App() {
  const location = useLocation();
  const hideNavbarFooter =
    ['/checkout', '/login', '/signup'].includes(location.pathname) ||
    location.pathname.startsWith('/admin');

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <CartToast />
      {!hideNavbarFooter && <Navbar />}
      <main id="main-content">
        <Suspense fallback={<p className="route-loading" role="status">Loading…</p>}>
        <Routes>
          <Route path="*" element={<div className="not-found container"><h1>Page not found</h1><p>Let’s find something beautiful instead.</p><a className="btn btn-primary" href="/">Return to store</a></div>} />
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
        </Suspense>
      </main>
      {!hideNavbarFooter && <Footer />}
    </>
  );
}

export default App;
