import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { seedState } from './data';
import { uid } from './utils';

const KEY = 'thrift-market-v3';
const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seedState(), ...JSON.parse(raw), toast: null };
  } catch {
    /* ignore corrupted storage */
  }
  return seedState();
}

const T = (s, msg, kind = 'ok') => ({ ...s, toast: { id: uid('t'), msg, kind } });

/**
 * EVENT-DRIVEN CORE
 * Every user event (click, change, submit) dispatches an action here.
 * The reducer is the single place state changes, and React re-renders the UI in response.
 */
function reducer(s, a) {
  const ck = s.session || 'guest';
  switch (a.type) {
    case 'TOAST':
      return T(s, a.msg, a.kind);
    case 'CLEAR_TOAST':
      return { ...s, toast: null };
    case 'RESET_DEMO':
      return T({ ...seedState() }, 'Demo data has been reset');

    /* ---------- auth & users ---------- */
    case 'LOGIN': {
      const merged = (s.carts[a.id] || []).map((i) => ({ ...i }));
      (s.carts.guest || []).forEach((g) => {
        const f = merged.find((m) => m.productId === g.productId);
        if (f) f.qty += g.qty;
        else merged.push({ ...g });
      });
      return T({ ...s, session: a.id, carts: { ...s.carts, guest: [], [a.id]: merged } }, 'Welcome back!');
    }
    case 'LOGOUT':
      return T({ ...s, session: null }, 'You have been logged out');
    case 'REGISTER':
      return T({ ...s, users: [...s.users, a.user], session: a.user.id }, 'Account created. Welcome to Thrift Market!');
    case 'UPDATE_USER':
      return T({ ...s, users: s.users.map((u) => (u.id === a.id ? { ...u, ...a.patch } : u)) }, a.msg || 'Changes saved');
    case 'DELETE_USER': {
      const { [a.id]: _c, ...carts } = s.carts;
      const { [a.id]: _f, ...favorites } = s.favorites;
      return T(
        {
          ...s,
          users: s.users.filter((u) => u.id !== a.id),
          products: s.products.filter((p) => p.sellerId !== a.id),
          carts, favorites,
        },
        'User account deleted'
      );
    }

    /* ---------- cart & favorites ---------- */
    case 'ADD_TO_CART': {
      const cart = s.carts[ck] || [];
      const next = cart.some((i) => i.productId === a.id)
        ? cart.map((i) => (i.productId === a.id ? { ...i, qty: i.qty + 1 } : i))
        : [...cart, { productId: a.id, qty: 1 }];
      return T({ ...s, carts: { ...s.carts, [ck]: next } }, 'Added to cart');
    }
    case 'SET_QTY':
      return {
        ...s,
        carts: { ...s.carts, [ck]: (s.carts[ck] || []).map((i) => (i.productId === a.id ? { ...i, qty: a.qty } : i)) },
      };
    case 'REMOVE_FROM_CART':
      return T({ ...s, carts: { ...s.carts, [ck]: (s.carts[ck] || []).filter((i) => i.productId !== a.id) } }, 'Removed from cart');
    case 'TOGGLE_FAV': {
      const list = s.favorites[ck] || [];
      const has = list.includes(a.id);
      return T(
        { ...s, favorites: { ...s.favorites, [ck]: has ? list.filter((x) => x !== a.id) : [...list, a.id] } },
        has ? 'Removed from favorites' : 'Saved to favorites'
      );
    }

    /* ---------- orders ---------- */
    case 'PLACE_ORDER': {
      const products = s.products.map((p) => {
        const line = a.order.items.find((i) => i.productId === p.id);
        if (!line) return p;
        const stock = Math.max(0, p.stock - line.qty);
        return { ...p, stock, status: stock === 0 ? 'sold' : p.status };
      });
      return T({ ...s, products, orders: [a.order, ...s.orders], carts: { ...s.carts, [ck]: [] } }, 'Order placed successfully!');
    }
    case 'UPDATE_ORDER': {
      const prev = s.orders.find((o) => o.id === a.id);
      let products = s.products;
      if (prev && a.patch.status === 'cancelled' && prev.status !== 'cancelled') {
        // cancelling puts the stock back on sale
        products = s.products.map((p) => {
          const line = prev.items.find((i) => i.productId === p.id);
          return line ? { ...p, stock: p.stock + line.qty, status: 'available' } : p;
        });
      }
      return T(
        { ...s, products, orders: s.orders.map((o) => (o.id === a.id ? { ...o, ...a.patch } : o)) },
        a.msg || 'Order updated'
      );
    }
    case 'DELETE_ORDER':
      return T({ ...s, orders: s.orders.filter((o) => o.id !== a.id) }, 'Order record deleted');

    /* ---------- products ---------- */
    case 'ADD_PRODUCT':
      return T({ ...s, products: [a.product, ...s.products] }, a.msg || 'Listing submitted for admin approval');
    case 'UPDATE_PRODUCT':
      return T({ ...s, products: s.products.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) }, a.msg || 'Listing updated');
    case 'DELETE_PRODUCT': {
      const strip = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.filter((x) => (x.productId ?? x) !== a.id)]));
      return T(
        { ...s, products: s.products.filter((p) => p.id !== a.id), carts: strip(s.carts), favorites: strip(s.favorites) },
        'Listing removed'
      );
    }

    /* ---------- categories ---------- */
    case 'ADD_CATEGORY':
      return T({ ...s, categories: [...s.categories, a.category] }, 'Category added');
    case 'EDIT_CATEGORY':
      return T({ ...s, categories: s.categories.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) }, 'Category updated');
    case 'DELETE_CATEGORY':
      return T({ ...s, categories: s.categories.filter((c) => c.id !== a.id) }, 'Category deleted');

    /* ---------- messages ---------- */
    case 'ADD_MESSAGE':
      return T({ ...s, messages: [a.message, ...s.messages] }, a.msg || 'Message sent');
    case 'DELETE_MESSAGE':
      return T({ ...s, messages: s.messages.filter((m) => m.id !== a.id) }, 'Message deleted');
    case 'ADD_PROBLEM':
      return T({ ...s, problems: [a.problem, ...s.problems] }, 'Report submitted. Our team will review it.');
    case 'DELETE_PROBLEM':
      return T({ ...s, problems: s.problems.filter((p) => p.id !== a.id) }, 'Report removed');
    default:
      return s;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { toast, ...persist } = state;
      localStorage.setItem(KEY, JSON.stringify(persist));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  const value = useMemo(() => {
    const found = state.users.find((u) => u.id === state.session);
    const user = found && found.active ? found : null;
    const ck = user ? user.id : 'guest';
    const rawCart = state.carts[ck] || [];
    const cart = rawCart
      .map((i) => ({ ...i, product: state.products.find((p) => p.id === i.productId) }))
      .filter((i) => i.product);
    const cartCount = cart.reduce((n, i) => n + i.qty, 0);
    const cartTotal = cart.reduce((n, i) => n + i.qty * i.product.price, 0);
    const favIds = user ? state.favorites[user.id] || [] : [];

    const popularity = {};
    state.orders.forEach((o) => {
      if (o.status !== 'cancelled') o.items.forEach((i) => (popularity[i.productId] = (popularity[i.productId] || 0) + i.qty * 2));
    });
    Object.values(state.favorites).forEach((list) => list.forEach((id) => (popularity[id] = (popularity[id] || 0) + 1)));

    const notify = (msg, kind = 'ok') => dispatch({ type: 'TOAST', msg, kind });
    const userName = (id) => state.users.find((u) => u.id === id)?.name || 'Unknown';
    const categoryName = (id) => state.categories.find((c) => c.id === id)?.name || 'Uncategorized';
    const categoryIcon = (id) => state.categories.find((c) => c.id === id)?.icon || 'tag';

    const api = {
      notify, userName, categoryName, categoryIcon,

      // `role` is the login page being used (buyer / seller / admin). Each page only lets its own role in.
      login(email, password, role) {
        const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) return { ok: false, error: 'Invalid email or password.' };
        if (role && u.role !== role) {
          // Never reveal that an admin account exists, and never let admins in through public pages.
          if (u.role === 'admin' || role === 'admin') return { ok: false, error: 'Invalid email or password.' };
          return { ok: false, error: `This is a ${u.role} account. Please use the ${u.role} login page.` };
        }
        if (!u.active) return { ok: false, error: 'This account has been deactivated. Please contact support.' };
        dispatch({ type: 'LOGIN', id: u.id });
        return { ok: true, user: u };
      },

      register({ name, email, password, confirm, role }) {
        if (!name.trim()) return { ok: false, error: 'Please enter your full name.' };
        if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
        if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
          return { ok: false, error: 'That email is already registered.' };
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
        const u = {
          id: uid('u'), name: name.trim(), email: email.trim(), password, role: role || 'buyer',
          active: true, phone: '', address: '', bio: '', createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'REGISTER', user: u });
        return { ok: true, user: u };
      },

      logout: () => dispatch({ type: 'LOGOUT' }),

      addToCart(pid) {
        const p = state.products.find((x) => x.id === pid);
        if (!p) return;
        if (user && p.sellerId === user.id) return notify('You cannot buy your own listing', 'warn');
        if (p.status === 'sold' || p.stock <= 0) return notify('Sorry, this item is sold out', 'warn');
        const inCart = rawCart.find((i) => i.productId === pid)?.qty || 0;
        if (inCart >= p.stock) return notify(`Only ${p.stock} available`, 'warn');
        dispatch({ type: 'ADD_TO_CART', id: pid });
      },
      setQty(pid, qty) {
        const p = state.products.find((x) => x.id === pid);
        if (!p) return;
        if (qty < 1) return dispatch({ type: 'REMOVE_FROM_CART', id: pid });
        if (qty > p.stock) return notify(`Only ${p.stock} available`, 'warn');
        dispatch({ type: 'SET_QTY', id: pid, qty });
      },
      toggleFav: (pid) => dispatch({ type: 'TOGGLE_FAV', id: pid }),

      placeOrder(delivery, payment) {
        if (!user) return { ok: false, error: 'Please log in first.' };
        if (!cart.length) return { ok: false, error: 'Your cart is empty.' };
        for (const i of cart) {
          if (i.product.status === 'sold' || i.product.stock < i.qty)
            return { ok: false, error: `"${i.product.name}" is no longer available in that quantity.` };
        }
        const order = {
          id: 'ORD-' + String(Date.now()).slice(-6),
          buyerId: user.id,
          items: cart.map((i) => ({
            productId: i.productId, name: i.product.name, price: i.product.price,
            qty: i.qty, sellerId: i.product.sellerId, icon: i.product.icon,
          })),
          total: cartTotal, delivery, payment, status: 'pending', note: '', createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'PLACE_ORDER', order });
        return { ok: true, order };
      },
    };

    return {
      state, dispatch, api, user, cart, cartCount, cartTotal, favIds, popularity,
      isFav: (pid) => favIds.includes(pid),
      visibleProducts: state.products.filter((p) => p.approval === 'approved'),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
