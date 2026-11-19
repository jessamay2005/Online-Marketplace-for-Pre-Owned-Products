import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from './store';
import { PanelLayout, PublicLayout } from './Layouts';
import { Toast } from './components';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Checkout from './pages/Checkout';
import { Login, SellerLogin, AdminLogin } from './pages/Auth';
import { useScrollEffects } from './motion';
import Profile from './pages/Profile';
import { About, Contact, Help } from './pages/Info';
import { SellerDashboard, SellItem, MyListings, SellerOrders, SellerProfile } from './pages/seller/Seller';
import {
  AdminDashboard, AdminUsers, AdminProducts, AdminOrders, AdminCategories, AdminReports, AdminAccount, AdminInbox,
} from './pages/admin/Admin';

function RequireRole({ roles, children }) {
  const { user } = useApp();
  const loc = useLocation();
  // Each kind of user is sent to its own login page. The admin page is never linked from the public site.
  const loginPath = roles.length === 1 && roles[0] === 'admin' ? '/admin/login' : roles.length === 1 && roles[0] === 'seller' ? '/seller/login' : '/login';
  if (!user) return <Navigate to={loginPath} state={{ from: loc.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

const sellerLinks = [
  { to: '/seller', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/seller/sell', label: 'Sell an Item', icon: 'plus' },
  { to: '/seller/listings', label: 'My Listings', icon: 'layers' },
  { to: '/seller/orders', label: 'Orders', icon: 'package' },
  { to: '/seller/profile', label: 'Seller Profile', icon: 'user' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/products', label: 'Products', icon: 'bag' },
  { to: '/admin/orders', label: 'Orders', icon: 'package' },
  { to: '/admin/categories', label: 'Categories', icon: 'tag' },
  { to: '/admin/reports', label: 'Reports', icon: 'trending' },
  { to: '/admin/inbox', label: 'Inbox', icon: 'mail' },
  { to: '/admin/account', label: 'My Account', icon: 'lock' },
];

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0); // braces matter: an effect must not return anything but a cleanup function
  }, [pathname]);
  return null;
}

export default function App() {
  useScrollEffects();
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<RequireRole roles={['buyer', 'seller', 'admin']}><Cart /></RequireRole>} />
          <Route path="favorites" element={<RequireRole roles={['buyer', 'seller', 'admin']}><Favorites /></RequireRole>} />
          <Route path="checkout" element={<RequireRole roles={['buyer', 'seller']}><Checkout /></RequireRole>} />
          <Route path="profile" element={<RequireRole roles={['buyer', 'seller', 'admin']}><Profile /></RequireRole>} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="help" element={<Help />} />
        </Route>

        {/* Login / register pages use their own full-screen layout */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Navigate to="/login" replace />} />
        <Route path="seller/login" element={<SellerLogin />} />
        <Route path="seller/register" element={<Navigate to="/seller/login" replace />} />
        <Route path="admin/login" element={<AdminLogin />} />

        <Route path="seller" element={<RequireRole roles={['seller']}><PanelLayout title="Seller Center" links={sellerLinks} /></RequireRole>}>
          <Route index element={<SellerDashboard />} />
          <Route path="sell" element={<SellItem />} />
          <Route path="edit/:id" element={<SellItem />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="profile" element={<SellerProfile />} />
        </Route>

        <Route path="admin" element={<RequireRole roles={['admin']}><PanelLayout title="Administrator" links={adminLinks} /></RequireRole>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="inbox" element={<AdminInbox />} />
          <Route path="account" element={<AdminAccount />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
