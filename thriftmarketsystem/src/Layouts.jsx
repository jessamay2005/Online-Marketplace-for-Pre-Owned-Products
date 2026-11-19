import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from './store';
import { Avatar, LogoMark } from './components';
import { Icon } from './icons';
import { BackToTop, ScrollProgress } from './motion';

export function PublicLayout() {
  const { user, api, cartCount, favIds } = useApp();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const [acct, setAcct] = useState(false);
  const close = () => { setMenu(false); setAcct(false); };

  const logout = () => { close(); api.logout(); nav('/'); };

  return (
    <div className="app">
      <ScrollProgress />
      <header className="header">
        <div className="container header-in">
          <Link to="/" className="logo" onClick={close}><LogoMark /> <span className="logo-text">Thrift<b>Market</b></span></Link>
          <button className="icon-btn burger" onClick={() => setMenu(!menu)} aria-label="Menu"><Icon name={menu ? 'x' : 'menu'} size={22} /></button>
          <nav className={`nav ${menu ? 'open' : ''}`}>
            <NavLink to="/" end onClick={close}>Home</NavLink>
            <NavLink to="/shop" onClick={close}>Shop</NavLink>
            <NavLink to="/about" onClick={close}>About</NavLink>
            <NavLink to="/contact" onClick={close}>Contact</NavLink>
            <NavLink to="/help" onClick={close}>Help</NavLink>
          </nav>
          <div className="header-actions">
            <Link to="/favorites" className="icon-link" title="Favorites" onClick={close}>
              <Icon name="heart" size={21} />{favIds.length > 0 && <i className="count">{favIds.length}</i>}
            </Link>
            <Link to="/cart" className="icon-link" title="Cart" onClick={close}>
              <Icon name="cart" size={21} />{cartCount > 0 && <i className="count">{cartCount}</i>}
            </Link>
            {user ? (
              <div className="dropdown">
                <button className="btn ghost small" onClick={() => setAcct(!acct)}>
                  <Avatar user={user} size={22} /> {user.name.split(' ')[0]} <Icon name="chevron-down" size={14} />
                </button>
                {acct && (
                  <div className="dropdown-menu">
                    {user.role === 'buyer' && <Link to="/profile" onClick={close}>My Profile & Orders</Link>}
                    {user.role === 'seller' && <Link to="/seller" onClick={close}>Seller Dashboard</Link>}
                    {user.role === 'admin' && <Link to="/admin" onClick={close}>Admin Panel</Link>}
                    <button onClick={logout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn ghost small" onClick={close}>Login</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main"><Outlet /></main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="logo light"><LogoMark /> <span className="logo-text">Thrift<b>Market</b></span></div>
            <p>Buy and sell pre-owned treasures. Give good things a second life.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop">All Products</Link>
            <Link to="/favorites">Favorites</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/help">Help & Support</Link>
          </div>
        </div>
        <div className="container footer-base">© {new Date().getFullYear()} Thrift Market. All Rights Reserved.</div>
      </footer>
      <BackToTop />
    </div>
  );
}

export function PanelLayout({ title, links }) {
  const { user, api } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="panel">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="logo light"><LogoMark /> <span className="logo-text">Thrift<b>Market</b></span></Link>
        <div className="side-title">{title}</div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>
              <Icon name={l.icon} size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/"><Icon name="arrow-left" size={16} /> Back to Store</Link>
          <button onClick={() => { api.logout(); nav('/'); }}><Icon name="log-out" size={16} /> Logout</button>
        </div>
      </aside>
      <div className="panel-main">
        <div className="panel-top">
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name="menu" size={22} /></button>
          <span className="signed"><Avatar user={user} size={28} /> <span>Signed in as <strong>{user?.name}</strong></span></span>
        </div>
        <div className="panel-content"><Outlet /></div>
      </div>
    </div>
  );
}
