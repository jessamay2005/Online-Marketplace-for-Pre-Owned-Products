import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from './store';
import { fileToDataUrl, money } from './utils';
import { productSources } from './images';
import { Icon, CATEGORY_ICONS } from './icons';


/**
 * <Photo> tries each URL in `srcs` in order. If one fails to load (missing file, offline, blocked),
 * the onError event moves on to the next one, and finally to a tidy placeholder.
 */
export function Photo({ srcs, alt = '', className = '', fallback }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const key = srcs.join('|');
  useEffect(() => { setI(0); setLoaded(false); }, [key]);
  const src = srcs[i];
  return (
    <div className={`photo ${loaded ? 'loaded' : ''} ${className}`}>
      {!loaded && <div className="photo-ph">{fallback}</div>}
      {src && (
        <img
          key={src} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setI((n) => n + 1); }}
        />
      )}
    </div>
  );
}

/** Section with a photo as its background (first URL that loads wins). Text sits on a dark overlay. */
export function BgPhoto({ srcs, className = '', children }) {
  const style = { backgroundImage: srcs.map((u) => `url("${u}")`).join(', ') };
  return (
    <section className={`bgphoto ${className}`} style={style}>
      <div className="bgphoto-in">{children}</div>
    </section>
  );
}

const PlaceholderMark = ({ icon }) => (
  <div className="ph-mark">
    <Icon name={icon || 'bag'} size={30} strokeWidth={1.5} />
  </div>
);

export function ProductImage({ product, index = 0, className = '' }) {
  return (
    <Photo
      srcs={productSources(product, index)}
      alt={product.name}
      className={`pimg ${className}`}
      fallback={<PlaceholderMark icon={product.icon} />}
    />
  );
}

export const LogoMark = () => (
  <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="#1f5c4a" />
    <path d="M16.6 13.2a3.5 3.5 0 1 1 3.4 3.7V19" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 19 8.6 27.1a1.7 1.7 0 0 0 1 3.1h20.8a1.7 1.7 0 0 0 1-3.1L20 19Z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M27.5 6.5h4.6a1.4 1.4 0 0 1 1.4 1.4v4.6l-6.2 6.2a1.4 1.4 0 0 1-2 0l-3.2-3.2a1.4 1.4 0 0 1 0-2z" fill="#d9663b" />
    <circle cx="31" cy="9.5" r="1.1" fill="#fff" />
  </svg>
);

const TONES = {
  pending: 'warn', confirmed: 'info', shipped: 'info', completed: 'ok', cancelled: 'bad', issue: 'bad',
  approved: 'ok', rejected: 'bad', available: 'ok', sold: 'muted', active: 'ok', inactive: 'bad',
  admin: 'info', seller: 'warn', buyer: 'muted',
};
export const Badge = ({ children, tone }) => (
  <span className={`badge ${tone || TONES[String(children).toLowerCase()] || 'muted'}`}>{children}</span>
);

export function Toast() {
  const { state, dispatch } = useApp();
  const t = state.toast;
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800);
    return () => clearTimeout(id);
  }, [t, dispatch]);
  if (!t) return null;
  return (
    <div className={`toast ${t.kind}`} role="status">
      {t.msg}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const StatCard = ({ label, value, icon, hint }) => (
  <div className="stat">
    <div className="stat-icon"><Icon name={icon} size={22} /></div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  </div>
);

export const ICON_LABELS = {
  shirt: 'Clothes', shoe: 'Shoes', handbag: 'Bags', plug: 'Electronics', book: 'Books', armchair: 'Furniture', blocks: 'Toys',
  watch: 'Accessories', vase: 'Home decor', music: 'Music', lamp: 'Lighting', camera: 'Cameras', tag: 'Other', home: 'Household',
};

export const Empty = ({ icon = 'bag', title, children }) => (
  <div className="empty">
    <div className="empty-icon"><Icon name={icon} size={34} strokeWidth={1.5} /></div>
    <h3>{title}</h3>
    {typeof children === 'string' ? <p>{children}</p> : children}
  </div>
);

export function Bars({ data, format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ProductCard({ p }) {
  const { user, api, isFav } = useApp();
  const nav = useNavigate();
  const sold = p.status === 'sold' || p.stock <= 0;

  const onFav = (e) => {
    e.preventDefault();
    if (!user) {
      api.notify('Please log in to save favorites', 'warn');
      nav('/login', { state: { from: '/favorites' } });
      return;
    }
    api.toggleFav(p.id);
  };

  return (
    <article className="card product-card">
      <Link to={`/product/${p.id}`} className="card-img">
        <ProductImage product={p} />
        {sold && <span className="sold-ribbon">SOLD</span>}
        <button className={`fav-btn ${isFav(p.id) ? 'on' : ''}`} onClick={onFav} aria-label="Toggle favorite">
          <Icon name="heart" size={18} fill={isFav(p.id)} />
        </button>
      </Link>
      <div className="card-body">
        <div className="card-meta">
          <span>{api.categoryName(p.categoryId)}</span>
          <Badge tone="muted">{p.condition}</Badge>
        </div>
        <Link to={`/product/${p.id}`} className="card-title">{p.name}</Link>
        <div className="card-seller">by {api.userName(p.sellerId)}</div>
        <div className="card-foot">
          <strong className="price">{money(p.price)}</strong>
          <button className="btn small" disabled={sold} onClick={() => api.addToCart(p.id)}>
            {sold ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

/** Round profile picture: shows the uploaded photo, or the first letter of the name. */
export function Avatar({ user, size = 44, className = '' }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (user?.avatar) return <img className={`avatar ${className}`} src={user.avatar} alt={user.name || 'Profile'} style={style} />;
  return <div className={`avatar ${className}`} style={style} aria-hidden="true">{(user?.name || '?')[0].toUpperCase()}</div>;
}

/** Hook with the upload / remove events for a user's profile photo. */
function useAvatar(user) {
  const { dispatch, api } = useApp();
  const inputRef = useRef(null);
  const pick = () => inputRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return api.notify('Please choose an image file', 'warn');
    if (file.size > 8 * 1024 * 1024) return api.notify('That image is too large (max 8 MB)', 'warn');
    try {
      const avatar = await fileToDataUrl(file, 320, true);
      dispatch({ type: 'UPDATE_USER', id: user.id, patch: { avatar }, msg: 'Profile photo updated' });
    } catch { api.notify('Could not read that image', 'warn'); }
  };
  const remove = () => dispatch({ type: 'UPDATE_USER', id: user.id, patch: { avatar: '' }, msg: 'Profile photo removed' });
  const input = <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />;
  return { pick, remove, input };
}

/** Big avatar with a camera button on the corner — used at the top of every profile page. */
export function AvatarBadge({ user, size = 88 }) {
  const { pick, input } = useAvatar(user);
  return (
    <div className="avatar-badge" style={{ width: size, height: size }}>
      <Avatar user={user} size={size} />
      <button type="button" className="cam" onClick={pick} aria-label="Change profile photo" title="Change photo"><Icon name="camera" size={15} /></button>
      {input}
    </div>
  );
}

/** "Profile photo" row for edit forms: preview + Upload / Remove buttons. */
export function PhotoField({ user }) {
  const { pick, remove, input } = useAvatar(user);
  return (
    <div className="photo-field">
      <Avatar user={user} size={64} />
      <div>
        <div className="label-text">Profile photo</div>
        <div className="btn-row tight">
          <button type="button" className="btn ghost small" onClick={pick}><Icon name="camera" size={15} /> {user.avatar ? 'Change photo' : 'Upload photo'}</button>
          {user.avatar && <button type="button" className="btn ghost small" onClick={remove}>Remove</button>}
        </div>
        <span className="muted small-text">JPG or PNG. It is cropped to a square.</span>
      </div>
      {input}
    </div>
  );
}

/** Visible grid of category icons, each with its name. Picking one calls onChange(icon, label). */
export function IconGrid({ value, onChange }) {
  return (
    <div className="icon-grid" role="listbox" aria-label="Category icon">
      {CATEGORY_ICONS.map((n) => (
        <button type="button" key={n} role="option" aria-selected={value === n} className={value === n ? 'on' : ''} onClick={() => onChange(n, ICON_LABELS[n])}>
          <Icon name={n} size={22} /><span>{ICON_LABELS[n]}</span>
        </button>
      ))}
    </div>
  );
}

/** Icon chooser shown as a dropdown button (click to open, pick one, it closes). */
export function IconPicker({ value, onChange, inline = false }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="icon-select" ref={box}>
      <button type="button" className="icon-select-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name={value} size={18} /> <span>Icon</span> <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div className={`icon-pop ${inline ? 'inline' : ''}`} role="listbox" aria-label="Category icon">
          {CATEGORY_ICONS.map((n) => (
            <button type="button" key={n} role="option" aria-selected={value === n} className={value === n ? 'on' : ''} onClick={() => { onChange(n); setOpen(false); }} title={n}>
              <Icon name={n} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
