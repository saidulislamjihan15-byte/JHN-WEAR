/* JHN WEAR V7 - Frontend / Backend API integration */

// If frontend + backend are deployed together on Render, keep this as '/api'.
// If you deploy the frontend separately, change it to:
// const API_BASE = 'https://your-backend.onrender.com/api';
const API_BASE = '/api';

const defaultProducts = [
  {id:1,name:'Casual Shirt + Jeans Set',price:2490,salePrice:2190,img:'assets/shirt_jeans_brown.jpg',images:['assets/shirt_jeans_brown.jpg'],tag:'NEW',cat:'set',stock:12,colors:['Brown','Black'],sizes:['M','L','XL','XXL']},
  {id:2,name:'Classic Pink Shirt + White Jeans',price:2390,salePrice:2190,img:'assets/shirt_jeans_pink.jpg',images:['assets/shirt_jeans_pink.jpg'],tag:'BEST SELLER',cat:'set',stock:8,colors:['Pink','White'],sizes:['M','L','XL','XXL']},
  {id:3,name:'Linen Shirt + Dark Jeans Set',price:2490,img:'assets/shirt_jeans_cream.jpg',images:['assets/shirt_jeans_cream.jpg'],tag:'TRENDING',cat:'set',stock:10,colors:['Cream','Black'],sizes:['M','L','XL']},
  {id:4,name:'Premium Cotton Shirt Pack',price:2990,img:'assets/shirts_pack.jpg',images:['assets/shirts_pack.jpg'],tag:'NEW',cat:'shirt',stock:7,colors:['White','Blue'],sizes:['M','L','XL','XXL']},
  {id:5,name:'Minimal Hoodie',price:2990,img:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=85',images:[],tag:'TRENDING',cat:'hoodie',stock:5,colors:['Black','Grey'],sizes:['M','L','XL']},
  {id:6,name:'Premium Basic Tee',price:1290,img:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=85',images:[],tag:'VALUE',cat:'tee',stock:20,colors:['Black','White'],sizes:['S','M','L','XL']}
];

let products = [];
let storeSettings = {whatsapp:'',dhaka:60,outside:120,storePhone:''};
let cart = JSON.parse(localStorage.getItem('jhn_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('jhn_wishlist') || '[]');
let selectedProduct = null;

const $ = id => document.getElementById(id);
const money = n => Number(n || 0).toLocaleString('en-US');
const apiUrl = path => `${API_BASE}${path}`;

function saveLocal() {
  localStorage.setItem('jhn_cart', JSON.stringify(cart));
  localStorage.setItem('jhn_wishlist', JSON.stringify(wishlist));
}

function normalizeProduct(p, index = 0) {
  return {
    ...p,
    id: p.id ?? index + 1,
    name: String(p.name || 'JHN WEAR Product'),
    price: Number(p.price || 0),
    salePrice: p.salePrice != null ? Number(p.salePrice) : undefined,
    img: p.img || 'assets/shirts_pack.jpg',
    images: Array.isArray(p.images) ? p.images : (p.img ? [p.img] : []),
    tag: p.tag || 'NEW',
    cat: p.cat || 'shirt',
    stock: p.stock == null ? 999 : Number(p.stock),
    colors: Array.isArray(p.colors) && p.colors.length ? p.colors : ['Black', 'White'],
    sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['M', 'L', 'XL']
  };
}

async function api(path, options = {}) {
  const opts = {...options, headers:{...(options.headers || {})}};
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  const response = await fetch(apiUrl(path), opts);
  let data = {};
  try { data = await response.json(); } catch (_) {}

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function loadStore() {
  try {
    const data = await api('/store');
    storeSettings = {...storeSettings, ...(data.settings || {})};
    products = Array.isArray(data.products) && data.products.length
      ? data.products.map(normalizeProduct)
      : defaultProducts.map(normalizeProduct);

    if ($('storePhone')) $('storePhone').textContent = storeSettings.storePhone || '01XXXXXXXXX';
    updateDelivery();
    renderProducts();
  } catch (error) {
    console.error('JHN WEAR store API error:', error);
    products = defaultProducts.map(normalizeProduct);
    renderProducts();
    showStoreError('Could not connect to the store server. Showing demo products for now.');
  }
}

function showStoreError(message) {
  const existing = $('storeError');
  if (existing) existing.textContent = message;
}

function priceHTML(p) {
  return p.salePrice && p.salePrice < p.price
    ? `<span class="sale">৳ ${money(p.salePrice)}</span> <del>৳ ${money(p.price)}</del>`
    : `৳ ${money(p.price)}`;
}

function productCard(p) {
  const liked = wishlist.some(x => String(x) === String(p.id));
  const sold = Number(p.stock) <= 0;
  return `<article class="product" data-cat="${p.cat}">
    <span class="tag">${sold ? 'OUT OF STOCK' : (p.tag || 'NEW')}</span>
    <button class="heart ${liked ? 'liked' : ''}" onclick="toggleWish('${String(p.id).replace(/'/g, "\\'")}')">${liked ? '♥' : '♡'}</button>
    <div class="product-img"><img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
    <h3>${escapeHtml(p.name)}</h3>
    <div class="price">${priceHTML(p)}</div>
    <button ${sold ? 'disabled' : ''} onclick="openProduct('${String(p.id).replace(/'/g, "\\'")}')">${sold ? 'OUT OF STOCK' : 'CHOOSE OPTIONS'}</button>
  </article>`;
}

function renderProducts(filter = 'all', query = '') {
  const q = String(query || '').trim().toLowerCase();
  const arr = products.filter(p =>
    (filter === 'all' || p.cat === filter) &&
    (!q || p.name.toLowerCase().includes(q))
  );
  $('products').innerHTML = arr.length
    ? arr.map(productCard).join('')
    : '<p class="muted">No products found.</p>';
}

function toggleWish(id) {
  const key = String(id);
  wishlist = wishlist.some(x => String(x) === key)
    ? wishlist.filter(x => String(x) !== key)
    : [...wishlist, id];
  saveLocal();
  renderProducts(getActiveFilter(), $('productSearch')?.value || '');
}

function getActiveFilter() {
  return document.querySelector('.filter.active')?.dataset.filter || 'all';
}

function openProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p || Number(p.stock) <= 0) return;

  selectedProduct = p;
  $('modalImg').src = p.img;
  $('modalImg').alt = p.name;
  $('modalName').textContent = p.name;
  $('modalPrice').innerHTML = priceHTML(p);
  if ($('modalStock')) $('modalStock').textContent = `${p.stock} in stock`;
  $('modalSize').innerHTML = p.sizes.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
  $('modalColor').innerHTML = p.colors.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
  $('productModal').classList.add('show');
}

function addToCart() {
  if (!selectedProduct) return;

  const size = $('modalSize').value;
  const color = $('modalColor').value;
  const key = `${selectedProduct.id}|${size}|${color}`;
  const found = cart.find(x => x.key === key);

  if (found) {
    if (found.qty >= Number(selectedProduct.stock)) {
      return alert('Sorry, you cannot add more than the available stock.');
    }
    found.qty++;
  } else {
    cart.push({
      key,
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: Number(selectedProduct.salePrice || selectedProduct.price),
      size,
      color,
      qty: 1
    });
  }

  renderCart();
  $('productModal').classList.remove('show');
  $('cart').classList.add('show');
}

function changeQty(i, delta) {
  if (!cart[i]) return;
  const product = products.find(p => String(p.id) === String(cart[i].id));
  const maxStock = product ? Number(product.stock) : Infinity;
  const next = cart[i].qty + delta;

  if (next > maxStock) return alert('You reached the available stock limit.');
  cart[i].qty = next;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  renderCart();
}

function removeItem(i) {
  cart.splice(i, 1);
  renderCart();
}

function getCartSubtotal() {
  return cart.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0), 0);
}

function renderCart() {
  let total = 0;
  let count = 0;

  $('items').innerHTML = cart.length
    ? cart.map((x, i) => {
        const line = Number(x.price || 0) * Number(x.qty || 0);
        total += line;
        count += Number(x.qty || 0);
        return `<div class="item">
          <div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.size)} • ${escapeHtml(x.color)}</small>
            <div class="qty">
              <button onclick="changeQty(${i},-1)">−</button>
              <span>${x.qty}</span>
              <button onclick="changeQty(${i},1)">+</button>
              <button class="remove" onclick="removeItem(${i})">Remove</button>
            </div>
          </div>
          <strong>৳ ${money(line)}</strong>
        </div>`;
      }).join('')
    : '<p class="muted">Your cart is empty.</p>';

  $('count').textContent = count;
  $('total').textContent = money(total);
  updateDelivery();
  saveLocal();
}

function updateDelivery() {
  if (!$('area') || !$('checkoutSubtotal')) return;

  const subtotal = getCartSubtotal();
  const area = $('area').value || 'dhaka';
  const delivery = area === 'outside'
    ? Number(storeSettings.outside || 0)
    : Number(storeSettings.dhaka || 0);

  $('checkoutSubtotal').textContent = money(subtotal);
  $('deliveryCharge').textContent = money(delivery);
  $('checkoutTotal').textContent = money(subtotal + delivery);
}

function openCheckout() {
  if (!cart.length) return alert('Your cart is empty.');
  updateDelivery();
  $('success').hidden = true;
  $('orderForm').hidden = false;
  $('checkoutModal').classList.add('show');
}

async function submitOrder(event) {
  event.preventDefault();
  if (!cart.length) return alert('Your cart is empty.');

  const name = $('customerName').value.trim();
  const phone = $('customerPhone').value.trim();
  const area = $('area').value;
  const address = $('address').value.trim();
  const subtotal = getCartSubtotal();
  const delivery = area === 'outside'
    ? Number(storeSettings.outside || 0)
    : Number(storeSettings.dhaka || 0);

  if (!name || !phone || !address) return alert('Please complete all required fields.');

  const submitButton = $('orderForm').querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'PLACING ORDER...';

  try {
    const data = await api('/orders', {
      method: 'POST',
      body: {
        name,
        phone,
        area,
        address,
        items: cart.map(x => ({
          name: x.name,
          size: x.size,
          color: x.color,
          qty: Number(x.qty),
          price: Number(x.price)
        })),
        subtotal,
        delivery,
        total: subtotal + delivery
      }
    });

    const orderId = data.order?.id || 'JHN-ORDER';
    $('successText').textContent = `Thank you, ${name}. Your order ${orderId} has been received. We will contact you at ${phone}.`;
    $('orderForm').hidden = true;
    $('success').hidden = false;
    cart = [];
    renderCart();
  } catch (error) {
    console.error('Order submission error:', error);
    alert(error.message || 'Could not place the order. Please try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupEvents() {
  $('cartBtn').onclick = () => $('cart').classList.add('show');

  // V7 HTML uses closeCart; keep compatibility with older markup too.
  const cartClose = $('closeCart') || $('close');
  if (cartClose) cartClose.onclick = () => $('cart').classList.remove('show');

  $('modalAdd').onclick = addToCart;
  $('checkout').onclick = openCheckout;
  $('orderForm').addEventListener('submit', submitOrder);
  $('area').addEventListener('change', updateDelivery);

  document.querySelectorAll('[data-close]').forEach(button => {
    button.onclick = () => {
      const target = $(button.dataset.close);
      if (target) target.classList.remove('show');
    };
  });

  document.querySelectorAll('.filter').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      renderProducts(button.dataset.filter, $('productSearch')?.value || '');
    };
  });

  $('productSearch')?.addEventListener('input', e => {
    renderProducts(getActiveFilter(), e.target.value);
  });

  $('search').onclick = () => {
    $('productSearch')?.focus();
    $('shop').scrollIntoView({behavior:'smooth'});
  };

  document.querySelectorAll('[data-jump]').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => {
        const filter = link.dataset.jump;
        const button = document.querySelector(`.filter[data-filter="${filter}"]`);
        if (button) button.click();
      }, 50);
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupEvents();
  renderCart();
  await loadStore();
  renderCart();
});
