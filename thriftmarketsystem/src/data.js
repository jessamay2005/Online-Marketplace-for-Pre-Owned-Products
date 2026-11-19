export const CONDITIONS = ['Like New', 'Good', 'Fair', 'Well Used'];
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'issue'];
export const PAYMENT_METHODS = ['Cash on Delivery', 'GCash', 'Bank Transfer', 'Credit / Debit Card'];

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const categories = [
  { id: 'c1', name: 'Clothing', icon: 'shirt' },
  { id: 'c2', name: 'Shoes', icon: 'shoe' },
  { id: 'c3', name: 'Bags', icon: 'handbag' },
  { id: 'c4', name: 'Electronics', icon: 'plug' },
  { id: 'c5', name: 'Books', icon: 'book' },
  { id: 'c6', name: 'Furniture', icon: 'armchair' },
  { id: 'c7', name: 'Toys', icon: 'blocks' },
  { id: 'c8', name: 'Accessories', icon: 'watch' },
  { id: 'c9', name: 'Home Decor', icon: 'vase' },
  { id: 'c10', name: 'Music', icon: 'music' },
];

const users = [
  { id: 'u1', name: 'Alex Admin', email: 'admin@thrift.com', password: 'admin123', role: 'admin', active: true, phone: '0917 000 0001', address: 'Thrift Market HQ', bio: '', createdAt: daysAgo(200) },
  { id: 'u2', name: 'Sam Seller', email: 'seller@thrift.com', password: 'seller123', role: 'seller', active: true, phone: '0917 000 0002', address: '12 Market St, Cebu City', bio: 'Curating quality pre-loved fashion and gadgets since 2024.', createdAt: daysAgo(160) },
  { id: 'u3', name: 'Rina Reyes', email: 'rina@thrift.com', password: 'seller123', role: 'seller', active: true, phone: '0917 000 0003', address: '88 Rizal Ave, Tacloban', bio: 'Home finds, books and vintage pieces.', createdAt: daysAgo(120) },
  { id: 'u4', name: 'Ben Buyer', email: 'buyer@thrift.com', password: 'buyer123', role: 'buyer', active: true, phone: '0917 000 0004', address: '5 Mabini St, Borongan', bio: '', createdAt: daysAgo(100) },
  { id: 'u5', name: 'Ana Cruz', email: 'ana@thrift.com', password: 'buyer123', role: 'buyer', active: true, phone: '0917 000 0005', address: '21 Luna St, Tacloban', bio: '', createdAt: daysAgo(40) },
  { id: 'u6', name: 'Dan Inactive', email: 'dan@thrift.com', password: 'buyer123', role: 'buyer', active: false, phone: '', address: '', bio: '', createdAt: daysAgo(20) },
];

const PHOTO = {'p1': 'denim,jacket', 'p2': 'leather,crossbody,bag', 'p3': 'sneakers,nike', 'p4': 'mechanical,keyboard', 'p5': 'harry,potter,books', 'p6': 'wooden,desk', 'p7': 'polaroid,camera', 'p8': 'wooden,toy,train', 'p9': 'wristwatch,silver', 'p10': 'floral,dress', 'p11': 'bluetooth,speaker', 'p12': 'acoustic,guitar', 'p13': 'ceramic,vase', 'p14': 'table,lamp,retro', 'p15': 'watch'};
const P = (id, name, categoryId, price, condition, icon, sellerId, description, extra = {}) => ({
  photo: PHOTO[id], id, name, categoryId, price, condition, icon, sellerId, description,
  images: [], stock: 1, status: 'available', approval: 'approved', featured: false,
  createdAt: daysAgo(extra.days ?? 30), ...extra,
});

const products = [
  P('p1', 'Vintage Denim Jacket', 'c1', 850, 'Good', 'shirt', 'u2', 'Classic 90s medium-wash denim jacket. Sturdy stitching, no tears, faint fading on the cuffs that adds character.', { featured: true, days: 3, stock: 2 }),
  P('p2', 'Leather Crossbody Bag', 'c3', 1200, 'Like New', 'handbag', 'u2', 'Genuine leather crossbody with adjustable strap and two zip compartments. Used a handful of times.', { featured: true, days: 5 }),
  P('p3', 'Nike Air Max Sneakers (size 9)', 'c2', 1800, 'Good', 'shoe', 'u2', 'Comfortable Air Max with plenty of tread left. Cleaned and deodorized. Original laces.', { featured: true, days: 8 }),
  P('p4', 'Mechanical Keyboard (Blue Switch)', 'c4', 1500, 'Good', 'plug', 'u2', 'Full-size mechanical keyboard with RGB backlight. All keys work. USB cable included.', { days: 2 }),
  P('p5', 'Harry Potter Book Set (1–4)', 'c5', 950, 'Fair', 'book', 'u3', 'Four paperback books with some wear on the spines. All pages intact, great for a re-read.', { featured: true, days: 12 }),
  P('p6', 'Solid Oak Study Desk', 'c6', 3500, 'Good', 'armchair', 'u3', 'Sturdy oak desk with one drawer. Minor surface scratches. Pickup or local delivery recommended.', { days: 15 }),
  P('p7', 'Polaroid Instant Camera', 'c4', 2200, 'Fair', 'camera', 'u3', 'Working instant camera with a fresh battery. Flash works. Film not included.', { days: 20, featured: true }),
  P('p8', 'Wooden Toy Train Set', 'c7', 450, 'Like New', 'blocks', 'u3', 'Handmade wooden train with 12 track pieces. Smooth paint, no loose parts.', { days: 1, stock: 3 }),
  P('p9', 'Silver Analog Watch', 'c8', 1100, 'Good', 'watch', 'u2', 'Minimalist silver watch with a new battery. Strap has light wear.', { days: 9 }),
  P('p10', 'Floral Summer Dress', 'c1', 520, 'Like New', 'shirt', 'u2', 'Lightweight floral midi dress, size M. Worn twice and laundered.', { days: 6 }),
  P('p11', 'Bluetooth Speaker', 'c4', 900, 'Good', 'plug', 'u3', 'Portable speaker with deep bass and 8-hour battery life.', { approval: 'pending', days: 0 }),
  P('p12', 'Acoustic Guitar', 'c10', 3800, 'Fair', 'music', 'u2', 'Beginner-friendly acoustic guitar with a new set of strings. Includes a soft case.', { days: 18 }),
  P('p13', 'Ceramic Vase', 'c9', 380, 'Good', 'vase', 'u3', 'Hand-glazed blue ceramic vase, 25 cm tall. No chips or cracks.', { approval: 'pending', days: 0 }),
  P('p14', 'Retro Table Lamp', 'c9', 640, 'Good', 'lamp', 'u3', 'Brass-finish retro lamp with a linen shade. Wiring tested.', { status: 'sold', stock: 0, days: 40 }),
  P('p15', 'Suspicious Replica Item', 'c8', 99, 'Fair', 'tag', 'u2', 'Listing that was rejected by the admin for violating guidelines.', { approval: 'rejected', days: 4 }),
];

const mkOrder = (id, buyerId, lines, status, days, payment = 'Cash on Delivery') => {
  const buyer = users.find((u) => u.id === buyerId);
  const items = lines.map(([pid, qty]) => {
    const p = products.find((x) => x.id === pid);
    return { productId: pid, name: p.name, price: p.price, qty, sellerId: p.sellerId, icon: p.icon };
  });
  return {
    id, buyerId, items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    delivery: { name: buyer.name, phone: buyer.phone, address: buyer.address, city: '', notes: '' },
    payment, status, note: '', createdAt: daysAgo(days),
  };
};

const orders = [
  mkOrder('ORD-1001', 'u4', [['p14', 1]], 'completed', 130, 'GCash'),
  mkOrder('ORD-1002', 'u4', [['p5', 1], ['p9', 1]], 'completed', 95),
  mkOrder('ORD-1003', 'u5', [['p2', 1]], 'completed', 70, 'Bank Transfer'),
  mkOrder('ORD-1004', 'u5', [['p3', 1], ['p10', 1]], 'completed', 45, 'GCash'),
  mkOrder('ORD-1005', 'u4', [['p12', 1]], 'shipped', 12),
  mkOrder('ORD-1006', 'u5', [['p1', 1], ['p8', 2]], 'confirmed', 6),
  mkOrder('ORD-1007', 'u4', [['p7', 1]], 'pending', 2, 'Credit / Debit Card'),
  mkOrder('ORD-1008', 'u5', [['p6', 1]], 'issue', 10),
  mkOrder('ORD-1009', 'u5', [['p11', 1]], 'completed', 22, 'GCash'),
  mkOrder('ORD-1010', 'u4', [['p13', 1], ['p4', 1]], 'completed', 17),
  mkOrder('ORD-1011', 'u5', [['p15', 1]], 'completed', 9, 'Bank Transfer'),
  mkOrder('ORD-1012', 'u4', [['p9', 1], ['p10', 1]], 'completed', 5, 'GCash'),
  mkOrder('ORD-1013', 'u5', [['p5', 1]], 'completed', 2),
];
orders[7].note = 'Buyer reports a deep scratch not shown in the photos.';

export const seedState = () => ({
  users, categories, products, orders,
  messages: [
    { id: 'm1', kind: 'contact', fromName: 'Lia Gomez', fromEmail: 'lia@example.com', subject: 'Can I become a seller?', message: 'Hi! How do I register as a seller and start listing my old clothes?', createdAt: daysAgo(3) },
    { id: 'm2', kind: 'inquiry', toUserId: 'u2', productId: 'p3', fromName: 'Ana Cruz', fromEmail: 'ana@thrift.com', subject: 'Question about Nike Air Max Sneakers', message: 'Is the size 9 US or UK? Thanks!', createdAt: daysAgo(1) },
  ],
  problems: [],
  carts: {},
  favorites: {},
  session: null,
  toast: null,
});
