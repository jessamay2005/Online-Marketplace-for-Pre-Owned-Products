import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { BgPhoto, Photo, ProductCard } from '../components';
import { SITE, categoryPhoto } from '../images';
import { Icon } from '../icons';

export default function Home() {
  const { state, visibleProducts, popularity, user } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');

  const available = visibleProducts.filter((p) => p.status === 'available' && p.stock > 0);
  const featured = available.filter((p) => p.featured).slice(0, 4);
  const recent = [...available].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const popular = [...available].sort((a, b) => (popularity[b.id] || 0) - (popularity[a.id] || 0)).slice(0, 4);

  const onSearch = (e) => {
    e.preventDefault();
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const steps = [
    { icon: '01', t: 'Browse & Search', d: 'Find pre-loved items by category, price or keyword.' },
    { icon: '02', t: 'Add to Cart', d: 'Save favorites and collect what you love in your cart.' },
    { icon: '03', t: 'Check Out', d: 'Enter delivery details and choose how you want to pay.' },
    { icon: '04', t: 'Receive & Enjoy', d: 'Sellers confirm and ship. Give an item a second life.' },
  ];
  const trust = [
    ['shield-check', 'Every listing reviewed', 'Admins approve items before they go live.'],
    ['repeat', 'Easy order tracking', 'Follow each order from pending to completed.'],
    ['recycle', 'Better for the planet', 'Reuse more, waste less.'],
    ['message', 'Talk to sellers', 'Ask questions before you buy.'],
  ];

  return (
    <>
      {/* ---------- hero with a real thrift-store photo ---------- */}
      <BgPhoto srcs={SITE.hero} className="hero">
        <div className="container hero-in">
          <span className="eyebrow light">Thrifted · Affordable · Sustainable</span>
          <h1>Discover Treasures, <em>shop with purpose.</em></h1>
          <p>Thrift Market brings buyers and sellers together to discover affordable secondhand gems, share pre-loved items, and make every purchase meaningful.</p>
          {user ? (
            /* logged in (buyer, seller or admin): search bar only */
            <form className="hero-search" onSubmit={onSearch}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jackets, keyboards, books…" aria-label="Search products" />
              <button className="btn accent">Search</button>
            </form>
          ) : (
            /* visitors: Shop now + Start selling only */
            <div className="hero-cta">
              <Link to="/shop" className="btn light">Shop Now</Link>
              <Link to="/seller/login" className="btn outline-light">Start Selling</Link>
            </div>
          )}
        </div>
      </BgPhoto>

      <section className="trust">
        <div className="container trust-grid">
          {trust.map(([i, t, d]) => (
            <div key={t}><span className="trust-ic"><Icon name={i} size={20} /></span><div><strong>{t}</strong><p>{d}</p></div></div>
          ))}
        </div>
      </section>

      {/* ---------- categories with photos ---------- */}
      <section className="container section">
        <div className="section-head"><div><span className="eyebrow">Browse</span><h2>Shop by Category</h2></div><Link to="/shop">All Products <Icon name="arrow-right" size={15} /></Link></div>
        <div className="cat-grid">
          {state.categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.id}`} className="cat-tile">
              <Photo srcs={categoryPhoto(c)} alt="" className="cat-photo" fallback={<span className="cat-fallback"><Icon name={c.icon} size={34} strokeWidth={1.4} /></span>} />
              <span className="cat-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <Section eyebrow="Hand-picked" title="Featured Products" items={featured} />
      <Section eyebrow="Just in" title="Recently Added" items={recent} />
      <Section eyebrow="Loved by buyers" title="Popular Products" items={popular} />

      {/* ---------- sell banner ---------- */}
      <BgPhoto srcs={SITE.sell} className="sell-banner">
        <div className="container">
          <h2>Turn what you no longer use into cash</h2>
          <p>List an item in minutes. Reach buyers in your community and manage every order from your seller dashboard.</p>
        </div>
      </BgPhoto>

      <section className="band">
        <div className="container section">
          <div className="section-head center"><div><h2>How it Works</h2></div></div>
          <div className="steps">
            {steps.map((s) => (
              <div className="step" key={s.t}>
                <div className="step-icon">{s.icon}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section about-strip">
        <div>
          <span className="eyebrow">Our story</span>
          <h2>About Thrift Market</h2>
          <p>
            Thrift Market is an online marketplace for pre-owned products. We connect buyers who want affordable, quality
            items with sellers who want to pass things on, reducing waste and keeping good things in use.
          </p>
          <Link to="/about" className="btn ghost">Learn More</Link>
        </div>
        <Photo srcs={SITE.about} alt="Clothes on a rack in a thrift shop" className="about-photo" fallback={<span className="cat-fallback"><Icon name="recycle" size={44} strokeWidth={1.4} /></span>} />
      </section>
    </>
  );
}

function Section({ eyebrow, title, items }) {
  return (
    <section className="container section">
      <div className="section-head">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        <Link to="/shop">View All <Icon name="arrow-right" size={15} /></Link>
      </div>
      <div className="grid">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
