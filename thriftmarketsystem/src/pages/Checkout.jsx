import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Icon } from '../icons';
import { PAYMENT_METHODS } from '../data';
import { Empty } from '../components';
import { money } from '../utils';

export default function Checkout() {
  const { user, cart, cartTotal, api } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '', city: '', notes: '',
  });
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [err, setErr] = useState('');
  const [placed, setPlaced] = useState(null);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const onConfirm = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.phone.trim() || !f.address.trim() || !f.city.trim()) {
      return setErr('Please complete your name, phone, address and city.');
    }
    const r = api.placeOrder(f, payment);
    if (!r.ok) return setErr(r.error);
    setErr('');
    setPlaced(r.order);
  };

  if (placed) {
    return (
      <div className="container section narrow center">
        <div className="card pad">
          <div className="big-icon ok"><Icon name="check-circle" size={44} strokeWidth={1.6} /></div>
          <h1>Thank you for your order!</h1>
          <p>Your order <strong>{placed.id}</strong> totaling <strong>{money(placed.total)}</strong> has been placed.</p>
          <p className="muted">Payment: {placed.payment}. The seller will confirm it shortly.</p>
          <div className="btn-row center-row">
            <Link to="/profile" className="btn">View my orders</Link>
            <Link to="/shop" className="btn ghost">Keep shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="container section">
        <Empty icon="cart" title="Nothing to check out">Your cart is empty.</Empty>
        <div className="center"><Link to="/shop" className="btn">Browse the shop</Link></div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form className="cart-layout" onSubmit={onConfirm}>
        <div>
          <div className="card pad form">
            <h3>Delivery information</h3>
            <div className="two">
              <label>Full name<input name="name" value={f.name} onChange={onChange} /></label>
              <label>Phone<input name="phone" value={f.phone} onChange={onChange} /></label>
            </div>
            <label>Street address<input name="address" value={f.address} onChange={onChange} /></label>
            <label>City / Municipality<input name="city" value={f.city} onChange={onChange} /></label>
            <label>Notes for the seller (optional)<textarea name="notes" rows="2" value={f.notes} onChange={onChange} /></label>
          </div>

          <div className="card pad form mt">
            <h3>Payment method</h3>
            <div className="radio-grid">
              {PAYMENT_METHODS.map((m) => (
                <label key={m} className={`radio ${payment === m ? 'on' : ''}`}>
                  <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} />
                  {m}
                </label>
              ))}
            </div>
            <p className="muted small-text">This is a demo — no real payment is processed.</p>
          </div>
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          {cart.map(({ product: p, qty }) => (
            <div className="sum-row" key={p.id}><span><Icon name={p.icon} size={15} /> {p.name} × {qty}</span><span>{money(p.price * qty)}</span></div>
          ))}
          <div className="sum-row total"><span>Total</span><span>{money(cartTotal)}</span></div>
          {err && <div className="alert bad">{err}</div>}
          <button className="btn block">Confirm order</button>
          <button type="button" className="btn ghost block" onClick={() => nav('/cart')}>Back to cart</button>
        </aside>
      </form>
    </div>
  );
}
