import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store';
import { CONDITIONS } from '../data';
import { Empty, ProductCard } from '../components';

const PAGE = 8;

export default function Shop() {
  const { state, visibleProducts, popularity } = useApp();
  const [params, setParams] = useSearchParams();
  const [shown, setShown] = useState(PAGE);

  const q = params.get('q') || '';
  const cat = params.get('category') || '';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const cond = params.get('condition') || '';
  const sort = params.get('sort') || 'newest';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE);
  };

  let list = visibleProducts.filter((p) => {
    if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && p.categoryId !== cat) return false;
    if (cond && p.condition !== cond) return false;
    if (min !== '' && p.price < Number(min)) return false;
    if (max !== '' && p.price > Number(max)) return false;
    return true;
  });

  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    popular: (a, b) => (popularity[b.id] || 0) - (popularity[a.id] || 0),
  };
  list = [...list].sort(sorters[sort]);
  // sold items sink to the bottom
  list = [...list.filter((p) => p.status !== 'sold'), ...list.filter((p) => p.status === 'sold')];

  const hasFilters = q || cat || min || max || cond;

  return (
    <div className="container section">
      <div className="section-head">
        <h1>Shop</h1>
        <span className="muted">{list.length} item{list.length === 1 ? '' : 's'}</span>
      </div>

      <div className="shop-layout">
        <aside className="filters card">
          <label>Search
            <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search Products…" />
          </label>
          <label>Category
            <select value={cat} onChange={(e) => set('category', e.target.value)}>
              <option value="">All Categories</option>
              {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Condition
            <select value={cond} onChange={(e) => set('condition', e.target.value)}>
              <option value="">Any Condition</option>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="two">
            <label>Min ₱
              <input type="number" min="0" value={min} onChange={(e) => set('min', e.target.value)} />
            </label>
            <label>Max ₱
              <input type="number" min="0" value={max} onChange={(e) => set('max', e.target.value)} />
            </label>
          </div>
          <label>Sort By
            <select value={sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
          {hasFilters && (
            <button className="btn ghost" onClick={() => { setParams({}, { replace: true }); setShown(PAGE); }}>
              Clear Filters
            </button>
          )}
        </aside>

        <div>
          {list.length === 0 ? (
            <Empty icon="search" title="No Products Found">Try changing your search or filters.</Empty>
          ) : (
            <>
              <div className="grid">
                {list.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              {shown < list.length && (
                <div className="center mt">
                  <button className="btn ghost" onClick={() => setShown(shown + PAGE)}>Load More</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
