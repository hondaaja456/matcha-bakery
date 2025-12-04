// Interactive modal for product cards
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('menuGrid');
  const modal = document.getElementById('productModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const modalDesc = document.getElementById('modalDesc');
  const modalImage = document.getElementById('modalImage');
  const closeElements = modal.querySelectorAll('[data-close]');

  // --- new: populate card <img> from data-img if not set, and add error handler ---
  document.querySelectorAll('.card').forEach(card => {
    const imgEl = card.querySelector('.card-img');
    const dataImg = card.dataset.img;
    // If <img> src is missing or points to a placeholder, use data-img
    if (imgEl && dataImg && (!imgEl.getAttribute('src') || imgEl.getAttribute('src').trim() === '')) {
      imgEl.src = dataImg;
    }
    // If image fails to load, try dataset.img (if different) or use a small inline placeholder
    if (imgEl) {
      imgEl.addEventListener('error', () => {
        if (dataImg && imgEl.src !== dataImg) {
          imgEl.src = dataImg;
          return;
        }
        // small inline SVG placeholder (keeps layout)
        imgEl.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23F5EEDC"/><text x="50%" y="50%" font-size="20" fill="%234B3621" text-anchor="middle" dominant-baseline="middle">Image unavailable</text></svg>';
      });
    }
  });
  // --- end new block ---

  // Open modal when card clicked or Enter pressed while focused
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) openModalFromCard(card);
  });

  grid.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.card')) {
      e.preventDefault();
      openModalFromCard(e.target.closest('.card'));
    }
  });

  function openModalFromCard(card) {
    const name = card.dataset.name || 'Item';
    const price = card.dataset.price || '';
    const desc = card.dataset.desc || '';
    const img = card.dataset.img || '';

    modalTitle.textContent = name;
    modalPrice.textContent = price;
    modalDesc.textContent = desc;
    modalImage.src = img;
    modalImage.alt = name;

    modal.setAttribute('aria-hidden', 'false');
    // trap focus: focus the close button
    const firstFocusable = modal.querySelector('.modal-close');
    if (firstFocusable) firstFocusable.focus();

    // prevent background scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  // Close modal handlers
  closeElements.forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // return focus to the last focused card, or to the grid
    const last = document.activeElement;
    // try to find a card (simple fallback)
    const firstCard = grid.querySelector('.card');
    if (firstCard) firstCard.focus();
  }
});
