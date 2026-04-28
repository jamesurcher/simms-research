/**
 * Inline collection filter.
 * Hides product cards in the existing results-list grid as the user types.
 * Sort is delegated to Shopify via ?sort_by= URL param.
 *
 * Companion: sections/collection-filter.liquid
 */
class CollectionFilter extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('[data-search-input]');
    this.clearBtn = this.querySelector('[data-search-clear]');
    this.sortSelect = this.querySelector('[data-sort-select]');
    this.statusEl = this.querySelector('[data-status]');
    this.totalCount = parseInt(this.dataset.totalCount, 10) || 0;

    const gridSelector = this.dataset.gridSelector || 'results-list';
    const cardSelector = this.dataset.cardSelector || 'li.product-grid__item';

    this.grid = document.querySelector(gridSelector);
    if (!this.grid) {
      // Grid hasn't mounted yet — try once on next frame, then give up.
      if (!this._retried) {
        this._retried = true;
        requestAnimationFrame(() => this.connectedCallback());
      }
      return;
    }

    this.cards = Array.from(this.grid.querySelectorAll(cardSelector));
    this.cacheTitles();
    this.syncSortFromUrl();
    this.bindEvents();
    this.applyFilter();
  }

  cacheTitles() {
    this.cards.forEach((card) => {
      const link = card.querySelector('.product-card__link');
      const hidden = card.querySelector('.product-card__link .visually-hidden');
      const ariaLabel = link?.getAttribute('aria-label');
      const title = (hidden?.textContent || ariaLabel || card.textContent || '').trim();
      card.dataset.searchTitle = title.toLowerCase();
    });
  }

  syncSortFromUrl() {
    const params = new URLSearchParams(location.search);
    if (params.has('sort_by') && this.sortSelect) {
      this.sortSelect.value = params.get('sort_by');
    }
  }

  bindEvents() {
    if (this.input) {
      this.input.addEventListener('input', () => this.applyFilter());
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearSearch());
    }
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => this.applySort());
    }
  }

  applyFilter() {
    const q = (this.input?.value || '').trim().toLowerCase();
    let visible = 0;
    this.cards.forEach((card) => {
      const title = card.dataset.searchTitle || '';
      const match = !q || title.includes(q);
      card.hidden = !match;
      if (match) visible++;
    });
    this.updateStatus(visible, q);
    if (this.clearBtn) this.clearBtn.hidden = !q;
  }

  clearSearch() {
    if (!this.input) return;
    this.input.value = '';
    this.applyFilter();
    this.input.focus();
  }

  applySort() {
    if (!this.sortSelect) return;
    const value = this.sortSelect.value;
    const url = new URL(location.href);
    if (value === 'manual') {
      url.searchParams.delete('sort_by');
    } else {
      url.searchParams.set('sort_by', value);
    }
    location.href = url.toString();
  }

  updateStatus(visible, q) {
    if (!this.statusEl) return;
    const total = this.totalCount;
    if (q) {
      this.statusEl.textContent = `Showing ${visible} of ${total} products matching "${q}"`;
    } else {
      this.statusEl.textContent = `Showing ${total} of ${total} products`;
    }
  }
}

if (!customElements.get('collection-filter')) {
  customElements.define('collection-filter', CollectionFilter);
}
