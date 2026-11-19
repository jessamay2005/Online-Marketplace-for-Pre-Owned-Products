import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Icon } from '../icons';
import { AvatarBadge, Badge, Empty } from '../components';
import { fmtDate, money } from '../utils';

export default function Profile() {
  const { state, user, dispatch, api } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState('info');
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });

  if (user.role === 'seller') return <Navigate to="/seller/profile" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/account" replace />;

  const orders = state.orders.filter((o) => o.buyerId === user.id);

  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return api.notify('Name cannot be empty', 'warn');
    dispatch({ type: 'UPDATE_USER', id: user.id, patch: f, msg: 'Profile updated' });
    setTab('info');
  };

  return (
    <div className="container section">
      <div className="profile-head">
        <AvatarBadge user={user} />
        <div>
          <h1>{user.name}</h1>
          <p className="muted">{user.email} · <Badge>{user.role}</Badge></p>
        </div>
        {user.role === 'buyer' && <button className="btn ghost" onClick={() => { api.logout(); nav('/'); }}>Logout</button>}
      </div>

      <div className="tabs">
        {[['info', 'Personal Information'], ['edit', 'Edit Profile'], ['orders', `Order History (${orders.length})`]].map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card pad info-list">
          <div><span>Full Name</span>{user.name}</div>
          <div><span>Email</span>{user.email}</div>
          <div><span>Phone</span>{user.phone || '—'}</div>
          <div><span>Address</span>{user.address || '—'}</div>
          <div><span>Member Since</span>{fmtDate(user.createdAt)}</div>
        </div>
      )}

      {tab === 'edit' && (
        <form className="card pad form edit-form" onSubmit={save}>
          <div className="two">
            <label>Full Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Phone<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          </div>
          <label>Address<input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
          <div className="btn-row">
            <button className="btn">Save Changes</button>
            <button type="button" className="btn ghost" onClick={() => setTab('info')}>Cancel</button>
          </div>
        </form>
      )}

      {tab === 'orders' && (
        orders.length === 0 ? (
          <Empty icon="package" title="No orders yet">When you place an order it will show up here.</Empty>
        ) : (
          <div className="stack">
            {orders.map((o) => (
              <div className="card pad" key={o.id}>
                <div className="order-head">
                  <div><strong>{o.id}</strong> <span className="muted">· {fmtDate(o.createdAt)} · {o.payment}</span></div>
                  <Badge>{o.status}</Badge>
                </div>
                {o.items.map((i) => (
                  <div className="sum-row" key={i.productId}><span><Icon name={i.icon} size={15} /> {i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>
                ))}
                <div className="sum-row total"><span>Total</span><span>{money(o.total)}</span></div>
                {o.status === 'pending' && (
                  <button className="btn ghost small" onClick={() => dispatch({ type: 'UPDATE_ORDER', id: o.id, patch: { status: 'cancelled' }, msg: 'Order cancelled' })}>
                    Cancel Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
