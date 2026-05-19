if (!window.__volumeTierInit) {
  window.__volumeTierInit = true;

  const syncQty = (selector, qty) => {
    const scope = selector.closest('form') || selector.closest('product-form-component') || document;
    const qtyInput = scope.querySelector('input[name="quantity"]');
    if (!qtyInput) return;

    const quantitySelector = qtyInput.closest('quantity-selector-component');
    const nextQty = String(qty);

    if (quantitySelector && typeof quantitySelector.setValue === 'function') {
      quantitySelector.setValue(nextQty);
    } else {
      qtyInput.value = nextQty;
    }

    if (quantitySelector && typeof quantitySelector.onQuantityChange === 'function') {
      quantitySelector.onQuantityChange();
    }
    if (quantitySelector && typeof quantitySelector.updateButtonStates === 'function') {
      quantitySelector.updateButtonStates();
    }

    qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
    qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const syncTier = (qtyInput) => {
    const scope = qtyInput.closest('form') || document;
    const selectors = scope.querySelectorAll('volume-tier-selector');
    const qty = parseInt(qtyInput.value, 10) || 1;
    selectors.forEach((selector) => {
      const radios = selector.querySelectorAll('.volume-tier__radio');
      let match = null;
      radios.forEach((r) => {
        const threshold = parseInt(r.value, 10);
        if (threshold <= qty && (!match || threshold > parseInt(match.value, 10))) {
          match = r;
        }
      });
      if (match && !match.checked) match.checked = true;
    });
  };

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches && t.matches('.volume-tier__radio')) {
      const selector = t.closest('volume-tier-selector');
      if (selector) syncQty(selector, parseInt(t.value, 10) || 1);
      return;
    }
    if (t.matches && t.matches('input[name="quantity"]')) {
      syncTier(t);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches && e.target.matches('input[name="quantity"]')) {
      syncTier(e.target);
    }
  });
}
