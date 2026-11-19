import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Empty, ProductImage } from '../components';
import { Icon } from '../icons';
import { money } from '../utils';

export default function Favorites() {
  const { state, favIds, api } = useApp();
  const items = favIds.map((id) => state.products.find((p) => p.id === id)).filter(Boolean);

  if (!items.length) {
    return (
      <div className="container section">
        <Empty icon="heart" title="No favorites yet">
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/shop" className="btn">Shop Now</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>My Favorites</h1>
      <div className="card list">
        {items.map((p) => {
          const sold = p.status === 'sold' || p.stock <= 0;
          return (
            <div className="cart-row" key={p.id}>
              <Link to={`/product/${p.id}`} className="thumb"><ProductImage product={p} /></Link>
              <div className="grow">
                <Link to={`/product/${p.id}`} className="card-title">{p.name}</Link>
                <div className="muted small-text">{api.categoryName(p.categoryId)} · {p.condition}</div>
                <div className="price">{money(p.price)}</div>
              </div>
              <Link to={`/product/${p.id}`} className="btn ghost small">View Details</Link>
              <button className="btn small" disabled={sold} onClick={() => api.addToCart(p.id)}>{sold ? 'Sold out' : 'Add to cart'}</button>
              <button className="icon-btn danger" onClick={() => api.toggleFav(p.id)} aria-label="Remove from favorites"><Icon name="x" size={18} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
