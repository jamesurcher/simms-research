class ShippingEstimate extends HTMLElement {
  constructor() {
    super();
    this._rendered = false;
  }

  connectedCallback() {
    if (this._rendered) return;
    this.render();
    this._rendered = true;
  }

  render() {
    const minDays = parseInt(this.dataset.minDays, 10);
    const maxDays = parseInt(this.dataset.maxDays, 10);
    if (!Number.isFinite(minDays) || !Number.isFinite(maxDays)) return;

    const locale = this.dataset.locale || undefined;
    const start = this.addBusinessDays(new Date(), minDays);
    const end = this.addBusinessDays(new Date(), maxDays);

    const fmt = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    this.textContent = `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  addBusinessDays(date, days) {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) added += 1;
    }
    return result;
  }
}

if (!customElements.get('shipping-estimate')) {
  customElements.define('shipping-estimate', ShippingEstimate);
}
