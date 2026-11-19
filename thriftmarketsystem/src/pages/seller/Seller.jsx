import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store';
import { Icon } from '../../icons';
import { CONDITIONS } from '../../data';
import { AvatarBadge, Badge, Empty, Modal, ProductImage, StatCard } from '../../components';
import { ChartCard, HBarChart, SalesChart } from '../../charts';
import { fileToDataUrl, fmtDate, money, uid } from '../../utils';

const sellerOrders = (state, sellerId) =>
  state.orders.filter((o) => o.items.some((i) => i.sellerId === sellerId));

/* ------------------------------------------------------------------ Dashboard */
export function SellerDashboard() {
  const { state, user, api, dispatch } = useApp();
  const mine = state.products.filter((p) => p.sellerId === user.id);
  const available = mine.filter((p) => p.approval === 'approved' && p.status === 'available').length;
  const sold = mine.filter((p) => p.status === 'sold').length;
  const orders = sellerOrders(state, user.id);
  const pending = mine.filter((p) => p.approval === 'pending').length;
  const inquiries = state.messages.filter((m) => m.kind === 'inquiry' && m.toUserId === user.id);
  const earned = orders
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.items.filter((i) => i.sellerId === user.id).reduce((n, i) => n + i.price * i.qty, 0), 0);

  const mineLive = orders.filter((o) => o.status !== 'cancelled');
  const unitsByName = {};
  mineLive.forEach((o) => o.items.filter((i) => i.sellerId === user.id).forEach((i) => { unitsByName[i.name] = (unitsByName[i.name] || 0) + i.qty; }));
  const best = Object.entries(unitsByName).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  const byStatus = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'issue']
    .map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: orders.filter((o) => o.status === k).length }))
    .filter((x) => x.value > 0);

  return (
    <>
      <h1>Seller Dashboard</h1>
      <p className="muted">Welcome back, {user.name}. Here is how your shop is doing.</p>
      <div className="stats">
        <StatCard icon="layers" label="Total Posted Products" value={mine.length} />
        <StatCard icon="check-circle" label="Available Products" value={available} hint={pending ? `${pending} awaiting approval` : undefined} />
        <StatCard icon="tag" label="Sold Products" value={sold} />
        <StatCard icon="package" label="Total Orders" value={orders.length} hint={`${money(earned)} earned (completed)`} />
      </div>

      <div className="btn-row">
        <Link to="/seller/sell" className="btn"><Icon name="plus" size={16} /> Sell an Item</Link>
        <Link to="/seller/orders" className="btn ghost">Manage Orders</Link>
      </div>

      <div className="mt"><SalesChart orders={orders} sellerId={user.id} title="My Sales" /></div>
      <div className="charts mt">
        <ChartCard title="Best Sellers" sub="Units ordered" table={{ cols: ['Item', 'Units'], rows: best.map((b) => [b.label, b.value]) }}>
          <HBarChart data={best} />
        </ChartCard>
        <ChartCard title="Orders by Status" table={{ cols: ['Status', 'Orders'], rows: byStatus.map((b) => [b.label, b.value]) }}>
          <HBarChart data={byStatus} />
        </ChartCard>
      </div>

      <div className="card pad mt">
        <h3>Buyer Inquiries</h3>
        {inquiries.length === 0 ? <p className="muted">No messages yet.</p> : (
          <div className="stack">
            {inquiries.map((m) => (
              <div className="msg" key={m.id}>
                <div className="order-head">
                  <strong>{m.subject}</strong>
                  <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_MESSAGE', id: m.id })} aria-label="Delete"><Icon name="trash" size={18} /></button>
                </div>
                <p>{m.message}</p>
                <span className="muted small-text">From {m.fromName} ({m.fromEmail}) · {fmtDate(m.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Sell / Edit listing */
export function SellItem() {
  const { id } = useParams();
  const { state, user, api, dispatch } = useApp();
  const nav = useNavigate();
  const editing = id ? state.products.find((p) => p.id === id && p.sellerId === user.id) : null;

  const [f, setF] = useState(() => ({
    name: editing?.name || '',
    categoryId: editing?.categoryId || state.categories[0]?.id || '',
    price: editing?.price ?? '',
    stock: editing?.stock ?? 1,
    condition: editing?.condition || CONDITIONS[0],
    description: editing?.description || '',
    images: editing?.images || [],
  }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (id && !editing) return <Navigate to="/seller/listings" replace />;

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const onFiles = async (e) => {
    const files = [...e.target.files].slice(0, 4 - f.images.length);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setF((cur) => ({ ...cur, images: [...cur.images, ...urls].slice(0, 4) }));
    } catch {
      setErr('One of the images could not be read. Please try another file.');
    }
    setBusy(false);
    e.target.value = '';
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.description.trim()) return setErr('Please fill in the product name and description.');
    if (!(Number(f.price) > 0)) return setErr('Please enter a price greater than zero.');
    if (!(Number(f.stock) >= 1)) return setErr('Quantity must be at least 1.');
    const data = {
      name: f.name.trim(), categoryId: f.categoryId, price: Number(f.price), stock: Number(f.stock),
      condition: f.condition, description: f.description.trim(), images: f.images,
      icon: api.categoryIcon(f.categoryId),
    };
    if (editing) {
      const patch = { ...data, status: editing.status === 'sold' && data.stock > 0 ? 'available' : editing.status };
      if (editing.approval === 'rejected') patch.approval = 'pending';
      dispatch({ type: 'UPDATE_PRODUCT', id: editing.id, patch, msg: editing.approval === 'rejected' ? 'Listing resubmitted for approval' : 'Listing updated' });
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        product: { id: uid('p'), ...data, sellerId: user.id, status: 'available', approval: 'pending', featured: false, createdAt: new Date().toISOString() },
      });
    }
    nav('/seller/listings');
  };

  return (
    <>
      <h1>{editing ? 'Edit listing' : 'Sell an Item'}</h1>
      <p className="muted">{editing ? 'Update your Product Information.' : 'New listings are reviewed by an administrator before they appear in the shop.'}</p>
      <form className="card pad form" onSubmit={onSubmit}>
        <label>Product Name<input name="name" value={f.name} onChange={onChange} placeholder="e.g. Vintage denim jacket" /></label>
        <div className="two">
          <label>Category
            <select name="categoryId" value={f.categoryId} onChange={onChange}>
              {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Condition
            <select name="condition" value={f.condition} onChange={onChange}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="two">
          <label>Price (₱)<input type="number" min="1" step="any" name="price" value={f.price} onChange={onChange} /></label>
          <label>Quantity Available<input type="number" min="1" name="stock" value={f.stock} onChange={onChange} /></label>
        </div>
        <label>Description<textarea name="description" rows="4" value={f.description} onChange={onChange} placeholder="Size, brand, flaws, how long you used it…" /></label>

        <div>
          <div className="label-text">Product Images (up to 4)</div>
          <div className="img-picker">
            {f.images.map((src, i) => (
              <div className="img-thumb" key={i}>
                <img src={src} alt={`Upload ${i + 1}`} />
                <button type="button" onClick={() => setF({ ...f, images: f.images.filter((_, n) => n !== i) })} aria-label="Remove image"><Icon name="x" size={12} strokeWidth={2.4} /></button>
              </div>
            ))}
            {f.images.length < 4 && (
              <label className="img-add">
                {busy ? '…' : '＋'}
                <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
              </label>
            )}
          </div>
          <p className="muted small-text">No photo? We will show a category icon instead.</p>
        </div>

        {err && <div className="alert bad">{err}</div>}
        <div className="btn-row">
          <button className="btn" disabled={busy}>{editing ? 'Save changes' : 'Submit'}</button>
          <Link to="/seller/listings" className="btn ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ My listings */
function PriceCell({ p }) {
  const { dispatch, api } = useApp();
  const [v, setV] = useState(p.price);
  const save = () => {
    if (!(Number(v) > 0)) return api.notify('Enter a valid price', 'warn');
    dispatch({ type: 'UPDATE_PRODUCT', id: p.id, patch: { price: Number(v) }, msg: 'Price updated' });
  };
  return (
    <div className="inline-edit">
      <input type="number" min="1" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      {Number(v) !== p.price && <button className="btn small" onClick={save}>Save</button>}
    </div>
  );
}

export function MyListings() {
  const { state, user, api, dispatch } = useApp();
  const mine = state.products.filter((p) => p.sellerId === user.id);

  const setStatus = (p, status) => {
    const patch = { status };
    if (status === 'available' && p.stock <= 0) patch.stock = 1;
    dispatch({ type: 'UPDATE_PRODUCT', id: p.id, patch, msg: `Marked as ${status}` });
  };
  const remove = (p) => {
    if (window.confirm(`Delete “${p.name}”? This cannot be undone.`)) dispatch({ type: 'DELETE_PRODUCT', id: p.id });
  };

  return (
    <>
      <div className="section-head"><h1>My Listings</h1><Link to="/seller/sell" className="btn"><Icon name="plus" size={16} /> New Listing</Link></div>
      {mine.length === 0 ? (
        <Empty icon="layers" title="No listings yet">Post your first item to start selling.</Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>Price (₱)</th><th>Qty</th><th>Approval</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-prod">
                      <div className="thumb sm"><ProductImage product={p} /></div>
                      <div><Link to={`/product/${p.id}`}><strong>{p.name}</strong></Link><div className="muted small-text">{api.categoryName(p.categoryId)} · {p.condition}</div></div>
                    </div>
                  </td>
                  <td><PriceCell key={p.price} p={p} /></td>
                  <td>{p.stock}</td>
                  <td><Badge>{p.approval}</Badge></td>
                  <td>
                    <select value={p.status} onChange={(e) => setStatus(p, e.target.value)}>
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                    </select>
                  </td>
                  <td>
                    <div className="btn-row tight">
                      <Link to={`/seller/edit/${p.id}`} className="btn ghost small">Edit</Link>
                      <button className="btn danger small" onClick={() => remove(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Orders */
export function SellerOrders() {
  const { state, user, api, dispatch } = useApp();
  const [view, setView] = useState(null);
  const [filter, setFilter] = useState('all');

  const all = sellerOrders(state, user.id);
  const orders = filter === 'all' ? all : all.filter((o) => o.status === filter);
  const mineOf = (o) => o.items.filter((i) => i.sellerId === user.id);
  const subtotal = (o) => mineOf(o).reduce((n, i) => n + i.price * i.qty, 0);
  const setStatus = (o, status, msg) => dispatch({ type: 'UPDATE_ORDER', id: o.id, patch: { status }, msg });

  const nextActions = (o) => {
    const a = [];
    if (o.status === 'pending') a.push(<button key="c" className="btn small" onClick={() => setStatus(o, 'confirmed', 'Order confirmed')}>Confirm</button>);
    if (o.status === 'confirmed') a.push(<button key="s" className="btn small" onClick={() => setStatus(o, 'shipped', 'Order marked as shipped')}>Mark Shipped</button>);
    if (o.status === 'shipped') a.push(<button key="d" className="btn small" onClick={() => setStatus(o, 'completed', 'Order completed')}>Mark Completed</button>);
    if (['pending', 'confirmed'].includes(o.status)) a.push(<button key="x" className="btn danger small" onClick={() => setStatus(o, 'cancelled', 'Order cancelled')}>Cancel</button>);
    return a;
  };

  return (
    <>
      <div className="section-head">
        <h1>Order Management</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled', 'Issue'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {orders.length === 0 ? (
        <Empty icon="package" title="No orders">Customer orders for your items will appear here.</Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Your items</th><th>Subtotal</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.id}</strong><div className="muted small-text">{fmtDate(o.createdAt)}</div></td>
                  <td>{api.userName(o.buyerId)}</td>
                  <td>{mineOf(o).map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td>{money(subtotal(o))}</td>
                  <td><Badge>{o.status}</Badge></td>
                  <td><div className="btn-row tight">
                    <button className="btn ghost small" onClick={() => setView(o)}>Details</button>
                    {nextActions(o)}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title={`Order ${view.id}`} onClose={() => setView(null)}>
          <div className="info-list">
            <div><span>Status</span><Badge>{state.orders.find((o) => o.id === view.id)?.status}</Badge></div>
            <div><span>Placed</span>{fmtDate(view.createdAt)}</div>
            <div><span>Payment</span>{view.payment}</div>
            <div><span>Customer</span>{view.delivery.name}</div>
            <div><span>Phone</span>{view.delivery.phone}</div>
            <div><span>Deliver to</span>{[view.delivery.address, view.delivery.city].filter(Boolean).join(', ')}</div>
            {view.delivery.notes && <div><span>Notes</span>{view.delivery.notes}</div>}
          </div>
          <h4>Your Items</h4>
          {mineOf(view).map((i) => (
            <div className="sum-row" key={i.productId}><span><Icon name={i.icon} size={15} /> {i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>
          ))}
          <div className="sum-row total"><span>Subtotal</span><span>{money(subtotal(view))}</span></div>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Profile */
export function SellerProfile() {
  const { state, user, api, dispatch } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
  const mine = state.products.filter((p) => p.sellerId === user.id);

  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return api.notify('Name cannot be empty', 'warn');
    dispatch({ type: 'UPDATE_USER', id: user.id, patch: f, msg: 'Seller profile updated' });
    setEdit(false);
  };

  return (
    <>
      <div className="profile-head">
        <AvatarBadge user={user} />
        <div><h1>{user.name}</h1><p className="muted">{user.email} · <Badge>seller</Badge></p></div>
        <div className="btn-row">
          <button className="btn ghost" onClick={() => setEdit(!edit)}>{edit ? 'Cancel' : 'Edit Profile'}</button>
        </div>
      </div>

      {edit ? (
        <form className="card pad form edit-form" onSubmit={save}>
          <label>Seller / shop name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <div className="two">
            <label>Phone<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label>Address<input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
          </div>
          <label>About My Shop<textarea rows="3" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
          <div className="btn-row">
            <button className="btn">Save Profile</button>
            <button type="button" className="btn ghost" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="card pad info-list">
          <div><span>Name</span>{user.name}</div>
          <div><span>Email</span>{user.email}</div>
          <div><span>Phone</span>{user.phone || '—'}</div>
          <div><span>Address</span>{user.address || '—'}</div>
          <div><span>About</span>{user.bio || '—'}</div>
          <div><span>Member Since</span>{fmtDate(user.createdAt)}</div>
        </div>
      )}

      <div className="section-head mt"><h2>My Products ({mine.length})</h2></div>
      {mine.length === 0 ? <p className="muted">You have not posted anything yet.</p> : (
        <div className="mini-grid">
          {mine.map((p) => (
            <Link to={`/product/${p.id}`} className="card mini" key={p.id}>
              <div className="thumb"><ProductImage product={p} /></div>
              <strong>{p.name}</strong>
              <span>{money(p.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
