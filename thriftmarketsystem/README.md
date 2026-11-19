# Thrift Market — Online Marketplace for Pre-Owned Products

React 18 + Vite + React Router (HashRouter). Data is kept in `localStorage`, so no backend is needed.

## Run
```bash
npm install
npm run dev      # open the printed URL
npm run build    # production build in /dist
```

## Logins (three separate doors)
| Who | Page | Email | Password |
|---|---|---|---|
| Buyer | `/#/login` (register: `/#/register`) | buyer@thrift.com | buyer123 |
| Seller | `/#/seller/login` (register: `/#/seller/register`) | seller@thrift.com | seller123 |
| Admin | `/#/admin/login` — **not linked anywhere on the site** | admin@thrift.com | admin123 |

Each page only accepts its own kind of account. The login pages show no demo accounts; these credentials are for you and your presentation only.
Admin > My Account > "Reset demo data" restores the sample data.

## How the event-driven design works
1. **Events**: every click, change and submit is an event handler (`onClick`, `onChange`, `onSubmit`, `onKeyDown`).
2. **Actions**: handlers call `dispatch({ type: 'ADD_TO_CART', id })` (see `src/store.jsx`).
3. **Reducer**: one `reducer` function is the only place state changes.
4. **Re-render**: React redraws the UI and the state is saved to `localStorage`.

## Structure
- `src/store.jsx` – reducer, actions, business rules (stock, login, orders)
- `src/data.js` – sample users, products, orders
- `src/Layouts.jsx` – store layout and seller/admin sidebar layout
- `src/pages/` – buyer pages, `pages/seller/Seller.jsx`, `pages/admin/Admin.jsx`
- `src/styles.css` – all styling

## Features
Buyer: home, shop (search/category/price/condition/sort), product details, cart, favorites, checkout, login/register, profile and order history.
Seller: dashboard, sell an item (image upload), my listings (edit/price/status/delete), order management, profile.
Admin: dashboard, user/product/order/category management, approve/reject listings, reports (+CSV export), account and password.
Extra: About, Contact, Help & Support (FAQ, report a problem). Role-based route protection for buyer, seller, admin.

## Photos
`npm run dev` (and `npm run build`) first downloads the site photos into `public/images/` automatically, so they become real files in your project (needs internet the first time; later runs skip files that already exist). Run `npm run photos` to do it by hand, or `npm run photos -- --force` to re-download all.

All photos are configured in `src/images.js`. For each picture the site tries, in order:
1. Your own file in `public/images/` (`hero.jpg`, `sell.jpg`, `about.jpg`, `mission.jpg`, `categories/c1.jpg` … `products/p1.jpg` …). **Put your own photo here with the same name to replace any picture.**
2. The Unsplash photo online.
3. A neutral placeholder.

Seller-uploaded photos always take priority. Photos are from Unsplash (free to use).

## Icons and animation
- Icons: `src/icons.jsx` holds a Lucide-style SVG icon set. Use `<Icon name="cart" size={20} />`; the colour follows the text colour.
- Scroll animation: `src/motion.jsx` (IntersectionObserver reveal, header shadow, progress bar, hero parallax, back-to-top). It respects the "reduce motion" setting of the visitor's device.

## Latest changes
- **Dashboards with graphs**: seller dashboard (My sales, Best sellers, Orders by status) and admin dashboard (Sales overview, Orders by status, Users by role). Charts have hover tooltips and a "View as table" option.
- **Reports** are now graphs (sales, popular items, users, products) with CSV export kept.
- **Profile photos**: upload, change or remove a photo on every profile (buyer, seller, admin). Photos are cropped to a square and stored in the browser.
- **Admin categories**: icon picker is a compact dropdown.
- Data storage key is now `thrift-market-v3`, so demo data resets once. Admin → My Account → Reset demo data also resets it.
- Cart now asks guests to log in (same as Favorites); login/register sit inside one box with a "Continue shopping" button; "Related order" in Help is a pick-or-type field; category names fill in from the chosen icon.
- Register page: large 'I want to buy / I want to sell' cards at the top, plus a switch link at the bottom.
- Register is one form with a 'Register as' dropdown (Buyer / Seller).
- Separate register pages removed: "Create an account" on each login page opens a sign-up form on top of it (buyer and seller).
