import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { LogoMark, Modal } from '../components';
import { Icon } from '../icons';
import { SITE } from '../images';

/*
 * Three separate doors into the site:
 *   /login          buyers          (public)
 *   /seller/login   sellers         (linked from "Sell" pages)
 *   /admin/login    administrators  (NOT linked anywhere — you have to know the address)
 * Each page only lets its own kind of account in.
 */
const ROLES = {
  buyer: {
    title: 'Welcome Back!', sub: 'Log in to shop, save favorites and track your orders.', icon: 'bag',
    side: 'Thousands of pre-loved finds, one tap away.', home: '/', register: '/register',
  },
  seller: {
    title: 'Welcome, Seller!', sub: 'Manage your listings and customer orders.', icon: 'store',
    side: 'Turn the things you no longer use into cash.', home: '/seller', register: '/seller/register',
  },
  admin: {
    title: 'Administrator', sub: 'Authorized personnel only.', icon: 'shield-check',
    side: 'Keep the marketplace safe, fair and running smoothly.', home: '/admin', register: null,
  },
};

function AuthShell({ role, children }) {
  const r = ROLES[role];
  const bg = `url("${SITE.hero[0]}"), url("${SITE.hero[1]}")`;
  return (
    <div className={`auth auth-${role}`}>
      <aside className="auth-side" style={{ backgroundImage: bg }}>
        <Link to="/" className="logo light"><LogoMark /> <span className="logo-text">Thrift<b>Market</b></span></Link>
        <div>
          <span className="auth-badge"><Icon name={r.icon} size={18} /> {role === 'buyer' ? 'Shop' : role === 'seller' ? 'Seller Center' : 'Admin Console'}</span>
          <h2>{r.side}</h2>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          {children}
        </div>
      </main>
    </div>
  );
}

function Field({ icon, label, type = 'text', ...rest }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <label>
      {label}
      <span className="input-icon">
        <Icon name={icon} size={17} />
        <input type={isPw && show ? 'text' : type} {...rest} />
        {isPw && (
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
            <Icon name="eye" size={17} />
          </button>
        )}
      </span>
    </label>
  );
}

function LoginPage({ role }) {
  const { api } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const r = ROLES[role];
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);

  const onChange = (e) => { setF({ ...f, [e.target.name]: e.target.value }); setErr(''); };
  const onSubmit = (e) => {
    e.preventDefault();
    const res = api.login(f.email, f.password, role);
    if (!res.ok) return setErr(res.error);
    nav(role === 'buyer' ? loc.state?.from || r.home : r.home, { replace: true });
  };

  return (
    <AuthShell role={role}>
      <h1>{r.title}</h1>
      <p className="muted">{r.sub}</p>
      <form className="form" onSubmit={onSubmit}>
        <Field icon="mail" label="Email" type="email" name="email" value={f.email} onChange={onChange} autoComplete="email" placeholder="you@example.com" required />
        <Field icon="lock" label="Password" type="password" name="password" value={f.password} onChange={onChange} autoComplete="current-password" placeholder="Your password" required />
        {err && <div className="alert bad">{err}</div>}
        <button className="btn block">Login</button>
      </form>
      {r.register && <p className="center">New here? <button type="button" className="link-btn" onClick={() => setCreating(true)}>Create Account</button></p>}
      {role === 'buyer' && <p className="center small-text muted">Want to Sell? <Link to="/seller/login">Seller Login</Link></p>}
      {role === 'seller' && <p className="center small-text muted">Looking to Shop? <Link to="/login">Buyer Login</Link></p>}
      {creating && <CreateAccount role={role} onClose={() => setCreating(false)} />}
    </AuthShell>
  );
}

/* Opens on top of the login page, so there is no separate register page. */
function CreateAccount({ role, onClose }) {
  const { api } = useApp();
  const nav = useNavigate();
  const r = ROLES[role];
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const onChange = (e) => { setF({ ...f, [e.target.name]: e.target.value }); setErr(''); };
  const onSubmit = (e) => {
    e.preventDefault();
    const res = api.register({ ...f, role });
    if (!res.ok) return setErr(res.error);
    nav(r.home, { replace: true });
  };
  return (
    <Modal title={role === 'seller' ? 'Create Account' : 'Create Account'} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <Field icon="user" label="Full Name" name="name" value={f.name} onChange={onChange} autoComplete="name" required />
        <Field icon="mail" label="Email" type="email" name="email" value={f.email} onChange={onChange} autoComplete="email" required />
        <div className="two">
          <Field icon="lock" label="Password" type="password" name="password" value={f.password} onChange={onChange} autoComplete="new-password" required />
          <Field icon="lock" label="Confirm Password" type="password" name="confirm" value={f.confirm} onChange={onChange} autoComplete="new-password" required />
        </div>
        {err && <div className="alert bad">{err}</div>}
        <button className="btn block">{role === 'seller' ? 'Register' : 'Register'}</button>
      </form>
    </Modal>
  );
}

export const Login = () => <LoginPage role="buyer" />;
export const SellerLogin = () => <LoginPage role="seller" />;
export const AdminLogin = () => <LoginPage role="admin" />;

