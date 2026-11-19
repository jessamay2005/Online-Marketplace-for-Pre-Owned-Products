/**
 * Scroll animations — all driven by browser events (scroll, IntersectionObserver).
 *  - sections, cards and tiles fade/slide in as they enter the screen
 *  - header gains a shadow after you scroll
 *  - a thin progress bar shows how far down the page you are
 *  - hero photo moves slower than the page (parallax)
 *  - a "back to top" button appears
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from './icons';

/* Elements that animate in when they scroll into view. */
const REVEAL = [
  '.section-head', '.product-card', '.cat-tile', '.step', '.trust-grid > div', '.about-strip > *',
  '.sell-banner .container', '.faq-item', '.stat', '.card.pad', '.table-wrap', '.filters', '.detail > *',
  '.cart-row', '.summary', '.empty', '.footer-grid > div', '.profile-head', '.charts > *',
].join(',');

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useScrollEffects() {
  const { pathname } = useLocation();

  /* 1) Reveal on scroll. Runs on every page change and whenever new elements are added to the page. */
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    const seen = new WeakSet(); // tracked per effect run, so React StrictMode's double-run can't leave elements unobserved
    const prime = (root) => {
      const found = root.matches?.(REVEAL) ? [root, ...root.querySelectorAll(REVEAL)] : [...root.querySelectorAll(REVEAL)];
      found.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const sibs = [...(el.parentElement?.children || [])].filter((c) => c.matches(REVEAL));
        el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 7) * 70}ms`);
        el.classList.add('reveal');
        io.observe(el);
      });
    };
    prime(document.body);
    const mo = new MutationObserver((muts) =>
      muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && prime(n)))
    );
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  /* 2) Header shadow, progress bar and hero parallax — one scroll listener, throttled with rAF. */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--progress', max > 0 ? `${(y / max) * 100}%` : '0%');
      document.querySelector('.header')?.classList.toggle('scrolled', y > 8);
      if (!reduced()) document.querySelector('.hero')?.style.setProperty('--py', `${Math.min(y, 800) * 0.35}px`);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [pathname]);
}

export function ScrollProgress() { return <div className="scroll-progress" aria-hidden="true" />; }

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button className={`to-top ${show ? 'show' : ''}`} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <Icon name="arrow-up" size={20} />
    </button>
  );
}
