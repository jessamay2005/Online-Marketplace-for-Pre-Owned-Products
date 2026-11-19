import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { GALLERY_SIZE } from '../images';
import { Icon } from '../icons';
import { Avatar, Badge, Empty, Modal, ProductCard, ProductImage } from '../components';
import { fmtDate, money, uid } from '../utils';

export default function ProductDetails() {
  const { id } = useParams();
  const { state, dispatch, user, api, isFav, visibleProducts } = useApp();
  const nav = useNavigate();
  const [img, setImg] = useState(0);
  const [contact, setContact] = useState(false);
  const [msg, setMsg] = useState('');

  const p = state.products.find((x) => x.id === id);
  const canSee = p && (p.approval === 'approved' || user?.role === 'admin' || user?.id === p.sellerId);
  if (!p || !canSee) {
    return <div className="container section"><Empty icon="help" title="Product not found">This listing may have been removed.</Empty></div>;
  }

  const seller = state.users.find((u) => u.id === p.sellerId);
  const sold = p.status === 'sold' || p.stock <= 0;
  const sellerCount = visibleProducts.filter((x) => x.sellerId === p.sellerId && x.status === 'available').length;
  const related = visibleProducts.filter((x) => x.categoryId === p.categoryId && x.id !== p.id && x.status === 'available').slice(0, 4);
  const thumbs = p.images?.length ? p.images : Array.from({ length: GALLERY_SIZE });

  const requireLogin = () => {
    api.notify('Please log in first', 'warn');
    nav('/login', { state: { from: `/product/${p.id}` } });
  };

  const onFav = () => (user ? api.toggleFav(p.id) : requireLogin());
  const onContact = () => (user ? setContact(true) : requireLogin());

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    dispatch({
      type: 'ADD_MESSAGE',
      msg: 'Message sent to the seller',
      message: {
        id: uid('m'), kind: 'inquiry', toUserId: p.sellerId, productId: p.id,
        fromName: user.name, fromEmail: user.email, subject: `Question about ${p.name}`,
        message: msg.trim(), createdAt: new Date().toISOString(),
      },
    });
    setMsg('');
    setContact(false);
  };

  return (
    <div className="container section">
      <div className="crumbs"><Link to="/shop">Shop</Link> / {api.categoryName(p.categoryId)} / {p.name}</div>
      <div className="detail">
        <div>
          <div className="detail-main"><ProductImage product={p} index={img} />{sold && <span className="sold-ribbon">SOLD</span>}</div>
          {thumbs.length > 1 && (
            <div className="thumbs">
              {thumbs.map((_, i) => (
                <button key={i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}>
                  <ProductImage product={p} index={i} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="card-meta"><span>{api.categoryName(p.categoryId)}</span><Badge tone="info">{p.condition}</Badge>
            {p.approval !== 'approved' && <Badge>{p.approval}</Badge>}
          </div>
          <h1>{p.name}</h1>
          <div className="price big">{money(p.price)}</div>
          <p className="muted">{sold ? 'Sold out' : `${p.stock} available`} · Listed {fmtDate(p.createdAt)}</p>

          <h4>Description</h4>
          <p>{p.description}</p>

          <div className="seller-box">
            <Avatar user={seller} size={44} />
            <div>
              <strong>{seller?.name || 'Unknown seller'}</strong>
              <div className="muted small-text">{sellerCount} item{sellerCount === 1 ? '' : 's'} available · Member since {seller ? fmtDate(seller.createdAt) : '—'}</div>
              {seller?.bio && <div className="small-text">{seller.bio}</div>}
            </div>
          </div>

          <div className="btn-row">
            <button className="btn" disabled={sold} onClick={() => api.addToCart(p.id)}><Icon name="cart" size={17} /> Add to cart</button>
            <button className="btn ghost" onClick={onFav}><Icon name="heart" size={17} fill={isFav(p.id)} /> {isFav(p.id) ? 'Saved' : 'Add to favorites'}</button>
            <button className="btn ghost" onClick={onContact}><Icon name="mail" size={17} /> Contact seller</button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <div className="section-head mt"><h2>You may also like</h2></div>
          <div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </>
      )}

      {contact && (
        <Modal title={`Message ${seller?.name}`} onClose={() => setContact(false)}>
          <form onSubmit={sendMessage} className="form">
            <p className="muted">About: {p.name}</p>
            <label>Your message
              <textarea rows="4" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Is this still available?" autoFocus required />
            </label>
            <button className="btn">Send message</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
