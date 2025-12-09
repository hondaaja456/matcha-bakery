// Cart + modal logic
// - Adds product modal opening when card clicked
// - Adds to cart with quantity & persistence (localStorage)
// - Renders cart modal and item controls
// Defensive: validates product data, localStorage guarded, try/catch to avoid runtime exceptions.

(function () {
  const SELECTORS = {
    card: '.card',
    productModal: '#productModal',
    modalOverlay: '[data-close]',
    modalClose: '.modal-close',
    modalTitle: '#modalTitle',
    modalImage: '#modalImage',
    modalPrice: '#modalPrice',
    modalDesc: '#modalDesc',
    addToCart: '#addToCart',
    cartButton: '#cartButton',
    cartCount: '#cartCount',
    cartModal: '#cartModal',
    cartList: '#cartList',
    cartTotal: '#cartTotal',
    checkoutButton: '#checkoutButton',
    clearCartButton: '#clearCartButton',
  };

  const STORAGE_KEY = 'mv_cart_v1';

  // In-memory cart: { id/name: { name, price, img, qty } }
  let cart = {};

  // Helpers
  function safeParsePrice(priceStr) {
    // Accepts formats like "$6.50" or "6.50"
    if (!priceStr) return 0;
    try {
      const n = Number(String(priceStr).replace(/[^0-9.-]+/g, ''));
      return Number.isFinite(n) ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function formatPrice(n) {
    return '$' + Number(n || 0).toFixed(2);
  }

  function isLocalStorageAvailable() {
    try {
      const testKey = '__ls_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Persistence
  function saveCart() {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // If localStorage fails, ignore but don't crash
      console.warn('Could not save cart to localStorage', e);
    }
  }

  function loadCart() {
    if (!isLocalStorageAvailable()) return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.warn('Could not load cart from localStorage', e);
      return {};
    }
  }

  // UI updates
  function updateCartBadge() {
    const countEl = document.querySelector(SELECTORS.cartCount);
    if (!countEl) return;
    const totalQty = Object.values(cart).reduce((sum, it) => sum + (it.qty || 0), 0);
    countEl.textContent = String(totalQty);
    // also set aria-label for accessibility
    const cartButton = document.querySelector(SELECTORS.cartButton);
    if (cartButton) {
      cartButton.setAttribute('aria-label', `Open cart (${totalQty} items)`);
    }
  }

  function calculateTotal() {
    return Object.values(cart).reduce((sum, it) => sum + (safeParsePrice(it.price) * (it.qty || 0)), 0);
  }

  function renderCart() {
    const listEl = document.querySelector(SELECTORS.cartList);
    const totalEl = document.querySelector(SELECTORS.cartTotal);
    if (!listEl || !totalEl) return;

    // Clear existing
    listEl.innerHTML = '';

    const items = Object.values(cart);
    if (items.length === 0) {
      listEl.innerHTML = '<p>Your cart is empty.</p>';
      totalEl.textContent = formatPrice(0);
      return;
    }

    items.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.style.display = 'flex';
      itemEl.style.alignItems = 'center';
      itemEl.style.justifyContent = 'space-between';
      itemEl.style.gap = '0.5rem';
      itemEl.style.marginBottom = '0.5rem';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '0.5rem';

      const img = document.createElement('img');
      img.src = item.img || '';
      img.alt = item.name || 'product';
      img.style.width = '48px';
      img.style.height = '48px';
      img.style.objectFit = 'cover';
      img.onerror = () => { img.style.display = 'none'; };

      const meta = document.createElement('div');
      const title = document.createElement('div');
      title.textContent = item.name || 'Unnamed';
      title.style.fontWeight = '600';
      const price = document.createElement('div');
      price.textContent = formatPrice(safeParsePrice(item.price));
      price.style.opacity = '0.8';
      meta.appendChild(title);
      meta.appendChild(price);

      left.appendChild(img);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.alignItems = 'center';
      right.style.gap = '0.25rem';

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.title = 'Decrease quantity';
      minus.dataset.action = 'decrease';
      minus.dataset.name = item.name;

      const qty = document.createElement('span');
      qty.textContent = String(item.qty || 0);
      qty.style.minWidth = '24px';
      qty.style.textAlign = 'center';

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.title = 'Increase quantity';
      plus.dataset.action = 'increase';
      plus.dataset.name = item.name;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.dataset.action = 'remove';
      remove.dataset.name = item.name;

      right.appendChild(minus);
      right.appendChild(qty);
      right.appendChild(plus);
      right.appendChild(remove);

      itemEl.appendChild(left);
      itemEl.appendChild(right);

      listEl.appendChild(itemEl);
    });

    totalEl.textContent = formatPrice(calculateTotal());
  }

  // Cart operations
  function addItemToCart(product) {
    if (!product || !product.name) return;
    const key = product.name;
    const existing = cart[key];
    if (existing) {
      existing.qty = (existing.qty || 0) + 1;
    } else {
      cart[key] = {
        name: product.name,
        price: product.price || '$0.00',
        img: product.img || '',
        qty: 1,
      };
    }
    saveCart();
    updateCartBadge();
  }

  function changeItemQty(name, delta) {
    if (!name || !cart[name]) return;
    cart[name].qty = Math.max(0, (cart[name].qty || 0) + delta);
    if (cart[name].qty === 0) {
      delete cart[name];
    }
    saveCart();
    updateCartBadge();
  }

  function removeItem(name) {
    if (!name) return;
    delete cart[name];
    saveCart();
    updateCartBadge();
  }

  function clearCart() {
    cart = {};
    saveCart();
    updateCartBadge();
  }

  // Modal utility
  function openModal(selector) {
    const host = document.querySelector(selector);
    if (!host) return;
    host.setAttribute('aria-hidden', 'false');
    host.style.display = 'block';
    // trap focus ideally; simple focus set
    const closeBtn = host.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(selector) {
    const host = document.querySelector(selector);
    if (!host) return;
    host.setAttribute('aria-hidden', 'true');
    host.style.display = 'none';
  }

  // Setup event listeners
  function init() {
    // load cart
    cart = loadCart();

    // update badge
    updateCartBadge();

  document.querySelectorAll(SELECTORS.card).forEach((card) => {
  card.addEventListener('click', (ev) => {
    ev.preventDefault();
    try {
      const ds = card.dataset || {};
      const name = ds.name || card.querySelector('.product-name')?.textContent || 'Unnamed';
      const normal = ds.pricenormal || "$0.00"; // Normal price
      const medium = ds.priceMedium || "$0.00"; // Medium price
      const large = ds.priceLarge || "$0.00";  // Large price
      const venti = ds.priceVenti || "$0.00";  // Venti price
      const price = ds.price || card.querySelector('.price-badge')?.textContent || '$0.00';
      const desc = ds.desc || '';
      const img = ds.img || card.querySelector('img')?.src || '';

      const titleEl = document.querySelector(SELECTORS.modalTitle);
      const priceEl = document.querySelector(SELECTORS.modalPrice);
      const descEl = document.querySelector(SELECTORS.modalDesc);
      const imgEl = document.querySelector(SELECTORS.modalImage);
      const sizeSelector = document.querySelector('#modalSizes'); // The size options div inside the modal

      // Fill modal content
      if (titleEl) titleEl.textContent = name;
      
      if (priceEl) {
       if (ds.priceMedium && ds.priceLarge && ds.priceVenti &&  ds.priceNormal) {
          priceEl.innerHTML = `
            <strong>Prices:</strong><br>
            Normal: ${normal}<br>
            Medium: ${medium}<br>
            Large: ${large}<br>
             Venti: ${venti}
          `;
          // Show size options if the product has multiple sizes
          sizeSelector.style.display = 'block';  // Make the size selector visible
        } else {
          priceEl.textContent = price; // For pastries or items with a single price
          sizeSelector.style.display = 'none'; // Hide the size options for pastries
        }
      }

      if (descEl) descEl.textContent = desc;
      if (imgEl) {
        imgEl.src = img;
        imgEl.alt = name;
        imgEl.onerror = () => { imgEl.style.display = 'none'; };
        imgEl.style.display = '';
      }

      // Store the product data on the "Add to Order" button for later use
      const addToCartBtn = document.querySelector(SELECTORS.addToCart);
      if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.dataset.product = JSON.stringify({ name, normal, medium, large, venti, img, desc });
      }

      openModal(SELECTORS.productModal); // Open the modal
    } catch (err) {
      console.error('Error opening product modal', err);
    }
  });


      // also allow keyboard activation
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          card.click();
        }
      });
    });

    // product modal add to cart
    const addToCartBtn = document.querySelector(SELECTORS.addToCart);
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', (e) => {
        try {
          addToCartBtn.disabled = true; // prevent double clicks while processing
          const p = addToCartBtn.dataset.product ? JSON.parse(addToCartBtn.dataset.product) : null;
          if (!p) {
            console.warn('No product data to add to cart');
            addToCartBtn.disabled = false;
            return;
          }
          const selectedSize = document.querySelector('#modalSizes input[name="size"]:checked')?.value;

// Determine correct price
let finalPrice = null;

if (selectedSize === 'medium') {
  finalPrice = p.medium;
  } else if (selectedSize === 'normal') {
  finalPrice = p.normal;
} else if (selectedSize === 'large') {
  finalPrice = p.large;
} else if (selectedSize === 'venti') {
  finalPrice = p.venti;  
} else {
  // Pastries (no size selector)
  finalPrice = p.price || p.normal || p.medium || p.large || p.venti || "$0.00";
}

// Build the final cart item
const finalItem = {
  name: selectedSize ? `${p.name} (${selectedSize})` : p.name,
  price: finalPrice,
  img: p.img,
};

// Add to cart
addItemToCart(finalItem);
          renderCart(); // update cart content if open
          // small visual confirmation: close product modal and optionally open cart
          closeModal(SELECTORS.productModal);
        } catch (err) {
          console.error('Error adding to cart', err);
        } finally {
          // re-enable with a short delay so user sees change
          setTimeout(() => { if (addToCartBtn) addToCartBtn.disabled = false; }, 200);
        }
      });
    }

    // open cart modal
    const cartButton = document.querySelector(SELECTORS.cartButton);
    if (cartButton) {
      cartButton.addEventListener('click', (e) => {
        renderCart();
        openModal(SELECTORS.cartModal);
      });
    }

    // cart modal event delegation for increase/decrease/remove
    const cartList = document.querySelector(SELECTORS.cartList);
    if (cartList) {
      cartList.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn || !btn.dataset.action) return;
        const action = btn.dataset.action;
        const name = btn.dataset.name;
        if (!name) return;
        if (action === 'increase') {
          changeItemQty(name, +1);
        } else if (action === 'decrease') {
          changeItemQty(name, -1);
        } else if (action === 'remove') {
          removeItem(name);
        }
        renderCart();
      });
    }

    // Checkout: just a placeholder — wire to your backend/checkout flow
    const checkoutBtn = document.querySelector(SELECTORS.checkoutButton);
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        // simple demo: show console + clear
        const total = formatPrice(calculateTotal());
        alert(`Proceeding to checkout — total ${total}\n(Implement your checkout process here.)`);
      });
    }

    const clearBtn = document.querySelector(SELECTORS.clearCartButton);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all items from cart?')) {
          clearCart();
          renderCart();
        }
      });
    }

    // Modal close handlers (both product and cart)
    document.querySelectorAll(SELECTORS.modalOverlay + ',' + SELECTORS.modalClose).forEach((el) => {
      el.addEventListener('click', (ev) => {
        // find nearest modal parent
        const modal = ev.target.closest(SELECTORS.productModal + ',' + SELECTORS.cartModal);
        if (modal) {
          modal.setAttribute('aria-hidden', 'true');
          modal.style.display = 'none';
        } else {
          // fallback: close both
          closeModal(SELECTORS.productModal);
          closeModal(SELECTORS.cartModal);
        }
      });
    });

    // close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(SELECTORS.productModal);
        closeModal(SELECTORS.cartModal);
      }
    });

    // initial render of cart (in case persisted)
    renderCart();
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
