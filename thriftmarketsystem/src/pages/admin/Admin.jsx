import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { CONDITIONS, ORDER_STATUSES } from '../../data';
import { AvatarBadge, Badge, Empty, ICON_LABELS, IconGrid, Modal, ProductImage, StatCard } from '../../components';
import { ChartCard, ColumnChart, Donut, HBarChart, SalesChart } from '../../charts';
import { Icon } from '../../icons';
import { downloadCsv, fmtDate, money, monthKey, monthLabel, uid } from '../../utils';

/* Sales are counted only from orders that were actually completed. */
const isSale = (o) => o.status === 'completed';

/* ------------------------------------------------------------------ Dashboard */
export function AdminDashboard() {
  const { state, api } = useApp();
  const sellers = state.users.filter((u) => u.role === 'seller').length;
  const buyers = state.users.filter((u) => u.role === 'buyer').length;
  const sales = state.orders.filter(isSale).reduce((n, o) => n + o.total, 0);
  const pending = state.products.filter((p) => p.approval === 'pending').length;
  const issues = state.orders.filter((o) => o.status === 'issue').length;
  const unread = state.messages.filter((m) => m.kind === 'contact').length + state.problems.length;
  const byStatus = ORDER_STATUSES
    .map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: state.orders.filter((o) => o.status === k).length }))
    .filter((x) => x.value > 0);
  const roleData = [
    { label: 'Buyers', value: buyers, color: 'var(--s2)' },
    { label: 'Sellers', value: sellers, color: 'var(--s1)' },
    { label: 'Admins', value: state.users.filter((u) => u.role === 'admin').length, color: 'var(--s3)' },
  ];

  return (
    <>
      <h1>Admin Dashboard</h1>
      <p className="muted">A live overview of everything happening on Thrift Market.</p>
      <div className="stats">
        <StatCard icon="users" label="Registered Users" value={state.users.length} />
        <StatCard icon="store" label="Sellers" value={sellers} />
        <StatCard icon="bag" label="Buyers" value={buyers} />
        <StatCard icon="package" label="Total Products" value={state.products.length} hint={pending ? `${pending} awaiting approval` : undefined} />
        <StatCard icon="receipt" label="Total Orders" value={state.orders.length} hint={issues ? `${issues} with issues` : undefined} />
        <StatCard icon="coins" label="Total Sales" value={money(sales)} hint="Completed orders only" />
      </div>

      <SalesChart orders={state.orders} title="Sales Overview" sub="All sellers, completed orders" />

      <div className="charts mt">
        <ChartCard title="Orders by Status" table={{ cols: ['Status', 'Orders'], rows: byStatus.map((b) => [b.label, b.value]) }}>
          <HBarChart data={byStatus} />
        </ChartCard>
        <ChartCard title="Users by Role" table={{ cols: ['Role', 'Users'], rows: roleData.map((b) => [b.label, b.value]) }}>
          <Donut data={roleData} center="Users" />
        </ChartCard>
      </div>

      <div className="charts mt">
        <div className="card pad">
          <h3>Needs your Attention</h3>
          <div className="stack">
            <Link to="/admin/products" className="msg"><Icon name="clock" size={16} /> <strong>{pending}</strong> listing{pending === 1 ? '' : 's'} waiting for approval</Link>
            <Link to="/admin/orders" className="msg"><Icon name="alert" size={16} /> <strong>{issues}</strong> order{issues === 1 ? '' : 's'} with reported issues</Link>
            <Link to="/admin/inbox" className="msg"><Icon name="mail" size={16} /> <strong>{unread}</strong> item{unread === 1 ? '' : 's'} in the inbox (messages and problem reports)</Link>
          </div>
        </div>
        <div className="card pad">
          <h3>Recent Orders</h3>
          {state.orders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <div className="stack">
              {[...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((o) => (
                <div className="sum-row" key={o.id}>
                  <span><strong>{o.id}</strong> · {api.userName(o.buyerId)}</span>
                  <span>{money(o.total)} <Badge>{o.status}</Badge></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Users */
export function AdminUsers() {
  const { state, user: me, api, dispatch } = useApp();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [view, setView] = useState(null);   // user being viewed
  const [edit, setEdit] = useState(null);   // form state of user being edited

  const list = state.users.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      (u.name + u.email).toLowerCase().includes(q.trim().toLowerCase())
  );

  const toggleActive = (u) => {
    if (u.id === me.id) return api.notify('You cannot deactivate your own account', 'warn');
    dispatch({ type: 'UPDATE_USER', id: u.id, patch: { active: !u.active }, msg: u.active ? 'Account deactivated' : 'Account activated' });
  };
  const remove = (u) => {
    if (u.id === me.id) return api.notify('You cannot delete your own account', 'warn');
    if (window.confirm(`Delete ${u.name}? Their listings will be removed too.`)) dispatch({ type: 'DELETE_USER', id: u.id });
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (!edit.name.trim()) return api.notify('Name cannot be empty', 'warn');
    const clash = state.users.some((u) => u.id !== edit.id && u.email.toLowerCase() === edit.email.trim().toLowerCase());
    if (!/^\S+@\S+\.\S+$/.test(edit.email) || clash) return api.notify('Enter a valid, unused email address', 'warn');
    const { id, ...patch } = edit;
    dispatch({ type: 'UPDATE_USER', id, patch: { ...patch, email: patch.email.trim(), name: patch.name.trim() }, msg: 'User information updated' });
    setEdit(null);
  };

  const countFor = (u) => ({
    products: state.products.filter((p) => p.sellerId === u.id).length,
    orders: state.orders.filter((o) => o.buyerId === u.id).length,
  });

  return (
    <>
      <div className="section-head"><h1>User management</h1><span className="muted">{list.length} of {state.users.length} users</span></div>
      <div className="toolbar">
        <input type="search" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option><option value="buyer">Buyers</option>
          <option value="seller">Sellers</option><option value="admin">Admins</option>
        </select>
      </div>

      {list.length === 0 ? <Empty icon="users" title="No users found">Try a different search or role filter.</Empty> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong>{u.id === me.id && ' (you)'}<div className="muted small-text">{u.email}</div></td>
                  <td><Badge>{u.role}</Badge></td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td><Badge tone={u.active ? 'ok' : 'bad'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div className="btn-row tight">
                      <button className="btn ghost small" onClick={() => setView(u)}>View</button>
                      <button className="btn ghost small" onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', address: u.address || '', role: u.role })}>Edit</button>
                      <button className="btn ghost small" onClick={() => toggleActive(u)}>{u.active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn danger small" onClick={() => remove(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title="User details" onClose={() => setView(null)}>
          <div className="info-list">
            <div><span>Name</span>{view.name}</div>
            <div><span>Email</span>{view.email}</div>
            <div><span>Role</span><Badge>{view.role}</Badge></div>
            <div><span>Phone</span>{view.phone || '—'}</div>
            <div><span>Address</span>{view.address || '—'}</div>
            <div><span>Joined</span>{fmtDate(view.createdAt)}</div>
            <div><span>Listings</span>{countFor(view).products}</div>
            <div><span>Orders placed</span>{countFor(view).orders}</div>
          </div>
        </Modal>
      )}

      {edit && (
        <Modal title="Edit user" onClose={() => setEdit(null)}>
          <form className="form" onSubmit={saveEdit}>
            <label>Full name<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label>Email<input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
            <div className="two">
              <label>Phone<input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
              <label>Role
                <select value={edit.role} disabled={edit.id === me.id} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                  <option value="buyer">Buyer</option><option value="seller">Seller</option><option value="admin">Administrator</option>
                </select>
              </label>
            </div>
            <label>Address<input value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></label>
            <div className="btn-row m"><button className="btn">Save changes</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Products */
export function AdminProducts() {
  const { state, api, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);

  const counts = (k) => state.products.filter((p) => p.approval === k).length;
  const list = state.products.filter(
    (p) => (filter === 'all' || p.approval === filter) && p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const setApproval = (p, approval) =>
    dispatch({
      type: 'UPDATE_PRODUCT', id: p.id, patch: { approval },
      msg: approval === 'approved' ? 'Listing approved and now live' : 'Listing rejected',
    });
  const remove = (p) => {
    if (window.confirm(`Remove “${p.name}” from the marketplace?`)) dispatch({ type: 'DELETE_PRODUCT', id: p.id });
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (!edit.name.trim() || !(Number(edit.price) > 0)) return api.notify('Enter a name and a valid price', 'warn');
    const { id, ...f } = edit;
    dispatch({
      type: 'UPDATE_PRODUCT', id,
      patch: { name: f.name.trim(), price: Number(f.price), categoryId: f.categoryId, condition: f.condition, description: f.description, featured: f.featured },
      msg: 'Product information updated',
    });
    setEdit(null);
  };

  return (
    <>
      <div className="section-head"><h1>Product management</h1></div>
      <div className="pills">
        {[['all', `All (${state.products.length})`], ['pending', `Pending (${counts('pending')})`], ['approved', `Approved (${counts('approved')})`], ['rejected', `Rejected (${counts('rejected')})`]].map(([k, label]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div className="toolbar"><input type="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {list.length === 0 ? <Empty icon="bag" title="No products here">Nothing matches this filter.</Empty> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>Seller</th><th>Price</th><th>Approval</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><div className="cell-prod"><div className="thumb sm"><ProductImage product={p} /></div>
                    <div><strong>{p.name}</strong><div className="muted small-text">{api.categoryName(p.categoryId)} · {p.condition}</div></div></div></td>
                  <td>{api.userName(p.sellerId)}</td>
                  <td>{money(p.price)}</td>
                  <td><Badge>{p.approval}</Badge></td>
                  <td><Badge>{p.status}</Badge></td>
                  <td>
                    <div className="btn-row tight">
                      <button className="btn ghost small" onClick={() => setView(p)}>View</button>
                      {p.approval !== 'approved' && <button className="btn small" onClick={() => setApproval(p, 'approved')}>Approve</button>}
                      {p.approval !== 'rejected' && <button className="btn ghost small" onClick={() => setApproval(p, 'rejected')}>Reject</button>}
                      <button className="btn ghost small" onClick={() => setEdit({ id: p.id, name: p.name, price: p.price, categoryId: p.categoryId, condition: p.condition, description: p.description, featured: !!p.featured })}>Edit</button>
                      <button className="btn danger small" onClick={() => remove(p)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title={view.name} onClose={() => setView(null)}>
          <div className="thumb" style={{ width: '100%', height: 200, marginBottom: 12 }}><ProductImage product={view} /></div>
          <p>{view.description}</p>
          <div className="info-list">
            <div><span>Price</span>{money(view.price)}</div>
            <div><span>Category</span>{api.categoryName(view.categoryId)}</div>
            <div><span>Condition</span>{view.condition}</div>
            <div><span>Quantity</span>{view.stock}</div>
            <div><span>Seller</span>{api.userName(view.sellerId)}</div>
            <div><span>Listed</span>{fmtDate(view.createdAt)}</div>
          </div>
        </Modal>
      )}

      {edit && (
        <Modal title="Edit product" onClose={() => setEdit(null)}>
          <form className="form" onSubmit={saveEdit}>
            <label>Name<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <div className="two">
              <label>Price (₱)<input type="number" min="1" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label>
              <label>Condition
                <select value={edit.condition} onChange={(e) => setEdit({ ...edit, condition: e.target.value })}>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label>Category
              <select value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}>
                {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Description<textarea rows="3" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} /> Show in “Featured products”
            </label>
            <div className="btn-row m"><button className="btn">Save changes</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Orders */
export function AdminOrders() {
  const { state, api, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [viewId, setViewId] = useState(null);
  const [note, setNote] = useState('');

  const list = state.orders.filter(
    (o) => (filter === 'all' || o.status === filter) && (o.id + api.userName(o.buyerId)).toLowerCase().includes(q.trim().toLowerCase())
  );
  const view = state.orders.find((o) => o.id === viewId);

  const setStatus = (o, status) => dispatch({ type: 'UPDATE_ORDER', id: o.id, patch: { status }, msg: `Order marked as ${status}` });
  const remove = (o) => {
    if (window.confirm(`Delete order record ${o.id}?`)) { dispatch({ type: 'DELETE_ORDER', id: o.id }); setViewId(null); }
  };
  const open = (o) => { setViewId(o.id); setNote(o.note || ''); };
  const saveNote = () => dispatch({ type: 'UPDATE_ORDER', id: view.id, patch: { note }, msg: 'Order note saved' });
  const resolve = () => {
    dispatch({ type: 'UPDATE_ORDER', id: view.id, patch: { status: 'confirmed', note: note ? `${note} (resolved)` : 'Issue resolved' }, msg: 'Issue resolved. Order set back to confirmed.' });
  };

  return (
    <>
      <div className="section-head"><h1>Order Management</h1><span className="muted">{list.length} order{list.length === 1 ? '' : 's'}</span></div>
      <div className="toolbar">
        <input type="search" placeholder="Search order ID or buyer…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {list.length === 0 ? <Empty icon="package" title="No orders found">No orders match your search.</Empty> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.id}</strong><div className="muted small-text">{fmtDate(o.createdAt)}</div></td>
                  <td>{api.userName(o.buyerId)}</td>
                  <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><div className="btn-row tight">
                    <button className="btn ghost small" onClick={() => open(o)}>Details</button>
                    <button className="btn danger small" onClick={() => remove(o)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title={`Order ${view.id}`} wide onClose={() => setViewId(null)}>
          <div className="info-list">
            <div><span>Status</span><Badge>{view.status}</Badge></div>
            <div><span>Buyer</span>{api.userName(view.buyerId)}</div>
            <div><span>Placed</span>{fmtDate(view.createdAt)}</div>
            <div><span>Payment</span>{view.payment}</div>
            <div><span>Contact</span>{view.delivery.name} · {view.delivery.phone}</div>
            <div><span>Deliver to</span>{[view.delivery.address, view.delivery.city].filter(Boolean).join(', ') || '—'}</div>
          </div>
          <h4 className="mt">Items</h4>
          {view.items.map((i) => (
            <div className="sum-row" key={i.productId}><span><Icon name={i.icon} size={15} /> {i.name} × {i.qty} <span className="muted small-text">(seller: {api.userName(i.sellerId)})</span></span><span>{money(i.price * i.qty)}</span></div>
          ))}
          <div className="sum-row total"><span>Total</span><span>{money(view.total)}</span></div>

          <h4 className="mt">Issue handling</h4>
          <label className="form">
            <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note about this order or issue…" />
          </label>
          <div className="btn-row">
            <button className="btn ghost small" onClick={saveNote}>Save note</button>
            {view.status !== 'issue' && <button className="btn ghost small" onClick={() => setStatus(view, 'issue')}>Flag as issue</button>}
            {view.status === 'issue' && <button className="btn small" onClick={resolve}>Resolve issue</button>}
            {view.status === 'issue' && <button className="btn danger small" onClick={() => setStatus(view, 'cancelled')}>Cancel &amp; restock</button>}
          </div>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Categories */
export function AdminCategories() {
  const { state, api, dispatch } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState(null);

  const used = (id) => state.products.filter((p) => p.categoryId === id).length;
  const dupe = (n, ignoreId) => state.categories.some((c) => c.id !== ignoreId && c.name.toLowerCase() === n.trim().toLowerCase());

  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return api.notify('Enter a category name', 'warn');
    if (dupe(name)) return api.notify('That category already exists', 'warn');
    dispatch({ type: 'ADD_CATEGORY', category: { id: uid('c'), name: name.trim(), icon } });
    setName(''); setIcon('tag'); setAdding(false);
  };
  // picking an icon fills in its name when the name is still empty
  const pickNew = (v, label) => { setIcon(v); if (!name.trim() || Object.values(ICON_LABELS).includes(name)) setName(label); };
  const pickEdit = (v, label) => setEdit((e) => ({ ...e, icon: v, name: !e.name.trim() || Object.values(ICON_LABELS).includes(e.name) ? label : e.name }));
  const saveEdit = (e) => {
    e.preventDefault();
    if (!edit.name.trim()) return api.notify('Enter a category name', 'warn');
    if (dupe(edit.name, edit.id)) return api.notify('That category already exists', 'warn');
    dispatch({ type: 'EDIT_CATEGORY', id: edit.id, patch: { name: edit.name.trim(), icon: edit.icon } });
    setEdit(null);
  };
  const remove = (c) => {
    const n = used(c.id);
    if (n > 0) return api.notify(`“${c.name}” is used by ${n} product${n === 1 ? '' : 's'}. Reassign them first.`, 'warn');
    if (window.confirm(`Delete category “${c.name}”?`)) dispatch({ type: 'DELETE_CATEGORY', id: c.id });
  };

  return (
    <>
      <h1>Category Management</h1>
      <div className="btn-row m"><button className="btn" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add category</button></div>
      {adding && (
        <Modal title="New category" onClose={() => setAdding(false)}>
          <form className="form" onSubmit={add}>
            <div><div className="label-text">Choose an Icon</div><IconGrid value={icon} onChange={pickNew} /></div>
            <label>Category Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clothes" autoFocus /></label>
            <div className="btn-row m"><button className="btn">Add Category</button><button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button></div>
          </form>
        </Modal>
      )}

      <div className="card table-wrap mt">
        <table className="table">
          <thead><tr><th>Category</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {state.categories.map((c) => (
              <tr key={c.id}>
                <td><span className="cat-cell"><Icon name={c.icon} size={20} /> <strong>{c.name}</strong></span></td>
                <td>{used(c.id)}</td>
                <td><div className="btn-row tight">
                  <button className="btn ghost small" onClick={() => setEdit({ ...c })}>Edit</button>
                  <button className="btn danger small" onClick={() => remove(c)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal title="Edit category" onClose={() => setEdit(null)}>
          <form className="form" onSubmit={saveEdit}>
            <div><div className="label-text">Icon</div><IconGrid value={edit.icon} onChange={pickEdit} /></div>
            <label>Name<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <div className="btn-row m"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Reports */
export function AdminReports() {
  const { state, api, popularity } = useApp();
  const [tab, setTab] = useState('sales');
  const sales = state.orders.filter(isSale);
  const total = sales.reduce((n, o) => n + o.total, 0);

  const byCategory = {};
  const byPayment = {};
  sales.forEach((o) => {
    byPayment[o.payment] = (byPayment[o.payment] || 0) + o.total;
    o.items.forEach((i) => {
      const cat = api.categoryName(state.products.find((p) => p.id === i.productId)?.categoryId) || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + i.price * i.qty;
    });
  });
  const toList = (obj) => Object.entries(obj).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const popular = state.products.map((p) => ({ label: p.name, value: popularity[p.id] || 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  // registrations for the last 6 months (months with nobody still show as 0)
  const regs = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - k));
    return { key: monthKey(d), label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 };
  });
  state.users.forEach((u) => { const r = regs.find((x) => x.key === monthKey(u.createdAt)); if (r) r.value += 1; });

  const count = (k, v) => state.products.filter((p) => p[k] === v).length;
  const catData = state.categories.map((c) => ({ label: c.name, value: state.products.filter((p) => p.categoryId === c.id).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  const roleData = [
    { label: 'Buyers', value: state.users.filter((u) => u.role === 'buyer').length, color: 'var(--s2)' },
    { label: 'Sellers', value: state.users.filter((u) => u.role === 'seller').length, color: 'var(--s1)' },
    { label: 'Admins', value: state.users.filter((u) => u.role === 'admin').length, color: 'var(--s3)' },
  ];
  const approvalData = [
    { label: 'Approved', value: count('approval', 'approved'), color: '#0ca30c' },
    { label: 'Pending', value: count('approval', 'pending'), color: '#fab219' },
    { label: 'Rejected', value: count('approval', 'rejected'), color: '#d03b3b' },
  ];
  const stockData = [
    { label: 'Available', value: count('status', 'available'), color: 'var(--s1)' },
    { label: 'Sold', value: count('status', 'sold'), color: 'var(--s2)' },
  ];

  const exportCsv = () => {
    if (tab === 'sales') downloadCsv('sales-report.csv', [['Order', 'Date', 'Buyer', 'Payment', 'Total'], ...sales.map((o) => [o.id, fmtDate(o.createdAt), api.userName(o.buyerId), o.payment, o.total])]);
    if (tab === 'popular') downloadCsv('popular-products.csv', [['Product', 'Popularity score'], ...popular.map((x) => [x.label, x.value])]);
    if (tab === 'users') downloadCsv('users-report.csv', [['Name', 'Email', 'Role', 'Status', 'Joined'], ...state.users.map((u) => [u.name, u.email, u.role, u.active ? 'Active' : 'Inactive', fmtDate(u.createdAt)])]);
    if (tab === 'products') downloadCsv('product-listings-report.csv', [['Product', 'Seller', 'Category', 'Price', 'Approval', 'Status'], ...state.products.map((p) => [p.name, api.userName(p.sellerId), api.categoryName(p.categoryId), p.price, p.approval, p.status])]);
    api.notify('Report downloaded');
  };

  const tabs = [['sales', 'Sales'], ['popular', 'Popular products'], ['users', 'Registered users'], ['products', 'Product listings']];
  const tbl = (cols, list, fmt = (v) => v) => ({ cols, rows: list.map((d) => [d.label, fmt(d.value)]) });

  return (
    <>
      <div className="section-head"><h1>Reports</h1><button className="btn ghost" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button></div>
      <div className="tabs">
        {tabs.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
      </div>

      {tab === 'sales' && (
        <>
          <div className="stats">
            <StatCard icon="coins" label="Total Sales" value={money(total)} />
            <StatCard icon="check-circle" label="Completed Orders" value={sales.length} />
            <StatCard icon="trending" label="Average Order" value={money(sales.length ? total / sales.length : 0)} />
          </div>
          <SalesChart orders={state.orders} title="Monthly sales" sub="All sellers" />
          <div className="charts mt">
            <ChartCard title="Sales by Category" table={tbl(['Category', 'Sales'], toList(byCategory), money)}><HBarChart data={toList(byCategory)} format={money} /></ChartCard>
            <ChartCard title="Sales by Payment method" table={tbl(['Method', 'Sales'], toList(byPayment), money)}><HBarChart data={toList(byPayment)} format={money} /></ChartCard>
          </div>
        </>
      )}

      {tab === 'popular' && (
        <ChartCard title="Most popular products" sub="Score = 2 points per unit ordered + 1 point per favorite" table={tbl(['Product', 'Score'], popular)}>
          <HBarChart data={popular} />
        </ChartCard>
      )}

      {tab === 'users' && (
        <>
          <div className="stats">
            <StatCard icon="users" label="Total users" value={state.users.length} />
            <StatCard icon="check-circle" label="Active" value={state.users.filter((u) => u.active).length} />
            <StatCard icon="ban" label="Inactive" value={state.users.filter((u) => !u.active).length} />
          </div>
          <div className="charts">
            <ChartCard title="New registrations" sub="Last 6 months" table={tbl(['Month', 'Users'], regs)}><ColumnChart data={regs} label="New registrations per month" /></ChartCard>
            <ChartCard title="Users by role" table={tbl(['Role', 'Users'], roleData)}><Donut data={roleData} center="Users" /></ChartCard>
          </div>
        </>
      )}

      {tab === 'products' && (
        <>
          <div className="stats">
            <StatCard icon="package" label="Total listings" value={state.products.length} />
            <StatCard icon="check-circle" label="Approved" value={count('approval', 'approved')} />
            <StatCard icon="clock" label="Pending" value={count('approval', 'pending')} />
            <StatCard icon="tag" label="Sold" value={count('status', 'sold')} />
          </div>
          <div className="charts">
            <ChartCard title="Approval Status" table={tbl(['Status', 'Listings'], approvalData)}><Donut data={approvalData} center="Listings" /></ChartCard>
            <ChartCard title="Availability" table={tbl(['Status', 'Listings'], stockData)}><Donut data={stockData} center="Listings" /></ChartCard>
          </div>
          <div className="mt"><ChartCard title="Listings by Category" table={tbl(['Category', 'Listings'], catData)}><HBarChart data={catData} /></ChartCard></div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Inbox (contact messages + problem reports) */
export function AdminInbox() {
  const { state, dispatch } = useApp();
  const contact = state.messages.filter((m) => m.kind === 'contact');
  return (
    <>
      <h1>Inbox</h1>
      <h3>Contact Messages ({contact.length})</h3>
      {contact.length === 0 ? <p className="muted">No messages.</p> : (
        <div className="stack">
          {contact.map((m) => (
            <div className="card pad" key={m.id}>
              <div className="order-head">
                <strong>{m.subject}</strong>
                <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_MESSAGE', id: m.id })} aria-label="Delete message"><Icon name="trash" size={18} /></button>
              </div>
              <p>{m.message}</p>
              <span className="muted small-text">From {m.fromName} · <a href={`mailto:${m.fromEmail}`}>{m.fromEmail}</a> · {fmtDate(m.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt">Problem Reports ({state.problems.length})</h3>
      {state.problems.length === 0 ? <p className="muted">No reports.</p> : (
        <div className="stack">
          {state.problems.map((p) => (
            <div className="card pad" key={p.id}>
              <div className="order-head">
                <div><Badge tone="warn">{p.type}</Badge> {p.orderId && <span className="muted">· Order {p.orderId}</span>}</div>
                <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_PROBLEM', id: p.id })} aria-label="Delete report"><Icon name="trash" size={18} /></button>
              </div>
              <p>{p.description}</p>
              <span className="muted small-text">Reported by {p.reporter} · {fmtDate(p.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Admin account */
export function AdminAccount() {
  const { user, api, dispatch } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');

  const saveInfo = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return api.notify('Enter a valid name and email', 'warn');
    dispatch({ type: 'UPDATE_USER', id: user.id, patch: { name: f.name.trim(), email: f.email.trim(), phone: f.phone }, msg: 'Admin information updated' });
  };
  const changePw = (e) => {
    e.preventDefault();
    if (pw.current !== user.password) return setErr('Your current password is incorrect.');
    if (pw.next.length < 6) return setErr('New password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return setErr('New passwords do not match.');
    dispatch({ type: 'UPDATE_USER', id: user.id, patch: { password: pw.next }, msg: 'Password changed successfully' });
    setPw({ current: '', next: '', confirm: '' });
    setErr('');
  };

  return (
    <>
      <div className="profile-head">
        <AvatarBadge user={user} />
        <div><h1>{user.name}</h1><p className="muted">{user.email} · <Badge>admin</Badge></p></div>
      </div>

      <div className="charts">
        <form className="card pad form" onSubmit={saveInfo}>
          <h3>Admin Information</h3>
          <label>Full Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Email<input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Phone<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <div className="btn-row m"><button className="btn">Save Changes</button></div>
        </form>

        <form className="card pad form" onSubmit={changePw}>
          <h3>Change Password</h3>
          <label>Current Password<input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></label>
          <label>New Password<input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></label>
          <label>Confirm New Password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></label>
          {err && <div className="alert bad">{err}</div>}
          <div className="btn-row m"><button className="btn">Update Password</button></div>
        </form>
      </div>

      <div className="card pad mt">
        <h3>Demo Data</h3>
        <p className="muted">Restore the original sample users, products and orders. Everything you changed will be lost.</p>
        <button className="btn danger" onClick={() => { if (window.confirm('Reset all demo data?')) { dispatch({ type: 'RESET_DEMO' }); nav('/'); } }}>Reset Demo Data</button>
      </div>
    </>
  );
}
