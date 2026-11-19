import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Empty, ProductImage } from '../components';
import { Icon } from '../icons';
import { money } from '../utils';

export default function Cart() {
  const { user, cart, cartTotal, cartCount, api, dispatch } = useApp();
  const nav = useNavigate();

  const checkout = () => {
    if (!user) {
      api.notify('Please log in to check out', 'warn');
      return nav('/login', { state: { from: '/checkout' } });
    }
    nav('/checkout');
  };

  if (!cart.length) {
    return (
      <div className="container section">
        <Empty icon="cart" title="Your cart is empty">
          <p>Find something you love in the shop.</p>
          <Link to="/shop" className="btn">Shop Now</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>Shopping Cart</h1>
      <div className="cart-layout">
        <div className="card list">
          {cart.map(({ product: p, qty }) => (
            <div className="cart-row" key={p.id}>
              <Link to={`/product/${p.id}`} className="thumb"><ProductImage product={p} /></Link>
              <div className="grow">
                <Link to={`/product/${p.id}`} className="card-title">{p.name}</Link>
                <div className="muted small-text">{api.categoryName(p.categoryId)} · {p.condition} · {p.stock} in stock</div>
                <div className="price">{money(p.price)}</div>
              </div>
              <div className="qty">
                <button onClick={() => api.setQty(p.id, qty - 1)} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => api.setQty(p.id, qty + 1)} aria-label="Increase">+</button>
              </div>
              <strong className="line-total">{money(p.price * qty)}</strong>
              <button className="icon-btn danger" onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: p.id })} aria-label="Remove"><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </div>

        <aside className="card summary">
          <h3>Order Total</h3>
          <div className="sum-row"><span>Items ({cartCount})</span><span>{money(cartTotal)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>Arranged with Seller</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(cartTotal)}</span></div>
          <button className="btn block" onClick={checkout}>Proceed to Checkout</button>
          <Link to="/shop" className="btn ghost block">Continue Shopping</Link>
        </aside>
      </div>
    </div>
  );
}
