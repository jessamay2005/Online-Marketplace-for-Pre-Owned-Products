import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { uid } from '../utils';
import { Icon } from '../icons';
import { SITE } from '../images';
import { BgPhoto } from '../components';

export function About() {
  const benefits = [
    ['coins', 'Save money', 'Quality items at a fraction of the original price.'],
    ['leaf', 'Help the planet', 'Reusing items cuts waste and reduces demand for new production.'],
    ['banknote', 'Earn from clutter', 'Turn things you no longer use into extra income.'],
    ['gem', 'Unique finds', 'Discover vintage and one-of-a-kind pieces you will not see elsewhere.'],
  ];
  return (
    <>
    <BgPhoto srcs={SITE.mission} className="page-banner">
      <div className="container">
        <span className="eyebrow light">About Us</span>
        <h1>Give good things a second life</h1>
      </div>
    </BgPhoto>
    <div className="container section">
      <p className="lead">
        Thrift Market is an online marketplace where people buy and sell pre-owned products — clothing, gadgets, books,
        furniture and more — in one simple, trustworthy place.
      </p>
      <div className="two-col">
        <div className="card pad"><h3 className="h-icon"><Icon name="target" size={20} /> Our Mission</h3><p>To make secondhand shopping easy, affordable and safe, so every good item finds a new home.</p></div>
        <div className="card pad"><h3 className="h-icon"><Icon name="eye" size={20} /> Our Vision</h3><p>A community where reuse is the first choice and sustainable shopping is the everyday norm.</p></div>
      </div>
      <div className="card pad mt">
        <h3>Purpose of the Website</h3>
        <p>
          This platform let sellers list pre-owned items, buyers discover and purchase them, and administrators keep the
          marketplace fair by approving listings, managing users and monitoring orders.
        </p>
      </div>
      <div className="section-head mt"><h2>Benefits of Buying and Selling Secondhand</h2></div>
      <div className="grid">
        {benefits.map(([icon, t, d]) => (
          <div className="card pad center" key={t}><div className="big-icon"><Icon name={icon} size={28} /></div><h4>{t}</h4><p className="muted">{d}</p></div>
        ))}
      </div>
    </div>
    </>
  );
}

export function Contact() {
  const { dispatch, user } = useApp();
  const empty = { name: user?.name || '', email: user?.email || '', subject: '', message: '' };
  const [f, setF] = useState(empty);
  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_MESSAGE',
      msg: 'Thanks! We received your message.',
      message: { id: uid('m'), kind: 'contact', fromName: f.name, fromEmail: f.email, subject: f.subject, message: f.message, createdAt: new Date().toISOString() },
    });
    setF(empty);
  };

  return (
    <div className="container section narrow">
      <h1>Contact Us</h1>
      <p className="muted">Questions, feedback or partnership ideas? We would love to hear from you.</p>
      <form className="card pad form" onSubmit={onSubmit}>
        <div className="two">
          <label>Name<input name="name" value={f.name} onChange={onChange} required /></label>
          <label>Email<input type="email" name="email" value={f.email} onChange={onChange} required /></label>
        </div>
        <label>Subject<input name="subject" value={f.subject} onChange={onChange} required /></label>
        <label>Message<textarea name="message" rows="5" value={f.message} onChange={onChange} required /></label>
        <div className="btn-row m"><button className="btn">Send Message</button></div>
      </form>
    </div>
  );
}

const FAQS = [
  ['How do I buy an item?', 'Browse the shop, add items to your cart, then log in and complete checkout with your delivery details and payment method.'],
  ['How do I start selling?', 'Register as a seller, open "Sell an Item", and submit your listing. An administrator reviews it before it appears in the shop.'],
  ['Why is my listing pending?', 'All new listings are reviewed by an administrator to keep the marketplace safe. Approved listings go live immediately.'],
  ['Can I cancel an order?', 'Yes, while the order is still pending you can cancel it from your profile’s order history.'],
  ['How do I contact a seller?', 'Open any product page and click “Contact seller”. You need to be logged in.'],
];

export function Help() {
  const { dispatch, user, state } = useApp();
  const [open, setOpen] = useState(0);
  const blank = { type: 'Order problem', orderId: '', description: '' };
  const [f, setF] = useState(blank);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_PROBLEM',
      problem: { id: uid('r'), ...f, reporter: user?.email || 'Guest', createdAt: new Date().toISOString() },
    });
    setF(blank);
  };

  const myOrders = !user ? [] : user.role === 'admin' ? state.orders
    : user.role === 'seller' ? state.orders.filter((o) => o.items.some((i) => i.sellerId === user.id))
    : state.orders.filter((o) => o.buyerId === user.id);

  return (
    <div className="container section">
      <h1>Help & Support</h1>

      <div className="faq">
        {FAQS.map(([q, a], i) => (
          <div className={`faq-item ${open === i ? 'open' : ''}`} key={q}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>{q}<span>{open === i ? '−' : '+'}</span></button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>

      <div className="two-col mt">
        <div className="card pad">
          <h3>User Guidelines</h3>
          <ul className="bullets">
            <li>Describe your items honestly, including flaws.</li>
            <li>Use your own photos and keep prices fair.</li>
            <li>No counterfeit, stolen, illegal or unsafe items.</li>
            <li>Be respectful when messaging buyers and sellers.</li>
            <li>Never share passwords or pay outside the platform.</li>
          </ul>
        </div>
        <div className="card pad">
          <h3>Customer Support</h3>
          <p>Our team replies within 1–2 business days.</p>
          <div className="contact-lines"><span><Icon name="mail" size={16} /> support@thriftmarket.example</span><span><Icon name="phone" size={16} /> 0917 000 0000</span><span><Icon name="clock" size={16} /> Mon–Sat, 9:00 AM – 6:00 PM</span></div>
          <Link to="/contact" className="btn ghost">Send us a Message</Link>
        </div>
      </div>

      <form className="card pad form mt report-form" onSubmit={onSubmit}>
        <div>
          <h3>Report a Problem</h3>
          <p className="muted m">Tell us what went wrong and our team will look into it.</p>
        </div>
        <div className="two">
          <label>Type of Problem
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {['Order Problem', 'Suspicious Listing', 'Seller or Buyer Behavior', 'Website Bug', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Related Order (Optional)
            <input list="my-orders" value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value })} placeholder={myOrders.length ? 'Pick one or type an order number' : 'e.g. ORD-1007'} />
            <datalist id="my-orders">
              {myOrders.map((o) => <option key={o.id} value={o.id}>{o.items.map((i) => i.name).join(', ').slice(0, 40)}</option>)}
            </datalist>
          </label>
        </div>
        <label>What Happened?<textarea rows="5" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Describe the problem with as much detail as you can…" required /></label>
        <div className="btn-row m"><button className="btn">Submit Report</button></div>
      </form>
    </div>
  );
}
