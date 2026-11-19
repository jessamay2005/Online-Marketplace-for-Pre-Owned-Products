/**
 * IMAGE SYSTEM — every picture on the site is configured here.
 *
 * For each picture the site tries, in order:
 *   1. Your own file in /public/images (e.g. public/images/hero.jpg, public/images/products/p1.jpg)
 *   2. A real photo from Unsplash (free to use, loaded directly from images.unsplash.com)
 *   3. A neutral placeholder (handled by <Photo /> in components.jsx)
 *
 * To change a photo: replace its Unsplash id below, or drop your own file into /public/images.
 */
const U = (id, w = 800, h) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`;

/* Big photos used on the homepage and info pages. */
export const SITE = {
  hero: ['/images/hero.jpg', U('1637228393246-c38a4b3d2011', 1800)],
  sell: ['/images/sell.jpg', U('1758779529327-4cbf5f8989b5', 1600)],
  about: ['/images/about.jpg', U('1679212622264-646085f5653f', 1000)],
  mission: ['/images/mission.jpg', U('1573612664822-d7d347da7b80', 1600)],
};

/* One photo per seeded product. */
const PRODUCT_PHOTO = {
  p1: '1575752229768-116115c80c8f',  // blue denim jacket
  p2: '1585488433963-2e35fb083e52',  // brown leather crossbody bag
  p3: '1600185652960-c9d8869d015c',  // Nike Air Max sneakers
  p4: '1756387462457-9afa97d2dbe8',  // mechanical keyboard
  p5: '1657124846200-094d5f8a2f0b',  // stack of secondhand books
  p6: '1762417691650-f2e4bcca7eaf',  // vintage wooden desk
  p7: '1580933031135-74149c053f51',  // Polaroid camera
  p8: '1505003098838-83ce5356c228',  // wooden toy train
  p9: '1628678172909-13a7209c7d62',  // silver analog watch
  p10: '1629482290622-ae05cae6f0fc', // floral dress on a hanger
  p11: '1549400854-b4300f444934',    // portable speaker
  p12: '1608436131232-db1b9a0d3f46', // acoustic guitar
  p13: '1694443212483-ba08baea24ce', // blue vase
  p14: '1592195986398-5484c0890b74', // brass table lamp
  p15: '1763909129757-d229a52a5811', // antique hutch with household items
};

/* Category tile photos (by category id). */
const CATEGORY_PHOTO = {
  c1: '1573612664822-d7d347da7b80', c2: PRODUCT_PHOTO.p3, c3: PRODUCT_PHOTO.p2, c4: PRODUCT_PHOTO.p7,
  c5: PRODUCT_PHOTO.p5, c6: PRODUCT_PHOTO.p6, c7: PRODUCT_PHOTO.p8, c8: PRODUCT_PHOTO.p9,
  c9: PRODUCT_PHOTO.p13, c10: PRODUCT_PHOTO.p12,
};

export const categoryPhoto = (c) => [
  `/images/categories/${c.id}.jpg`,
  ...(CATEGORY_PHOTO[c.id] ? [U(CATEGORY_PHOTO[c.id], 600)] : []),
];

/** One photo per seeded product; sellers can upload up to several of their own. */
export const GALLERY_SIZE = 1;

/** Candidate URLs for the picture at `index` of a product. Seller-uploaded photos always win. */
export function productSources(p, index = 0) {
  if (p.images?.[index]) return [p.images[index]];
  if (p.images?.length || index > 0) return [];
  return [`/images/products/${p.id}.jpg`, ...(PRODUCT_PHOTO[p.id] ? [U(PRODUCT_PHOTO[p.id], 800)] : [])];
}
