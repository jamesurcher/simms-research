if (window.customElements && !customElements.get('notify-me-form')) {
  customElements.define(
    'notify-me-form',
    class extends HTMLElement {
      connectedCallback() {
        this.form = this.querySelector('[data-notify-form]');
        this.email = this.querySelector('[data-notify-email]');
        this.honeypot = this.querySelector('[data-notify-honeypot]');
        this.submit = this.querySelector('[data-notify-submit]');
        this.label = this.querySelector('.notify-me__submit-label');
        this.loading = this.querySelector('.notify-me__submit-loading');
        this.status = this.querySelector('[data-notify-status]');
        this.endpoint = (this.dataset.endpoint || '').trim();
        this.productForm = this.closest('product-form-component');
        this.buyState = this.closest('[data-buy-state]');
        this.eventTarget = this.closest('.shopify-section, dialog, product-card') || document;
        this.currentVariantId = this.dataset.variantId || '';
        this.lastVariantId = this.currentVariantId;
        this.submittedVariantId = '';
        this.notifyVisible = this.buyState?.dataset.variantAvailable === 'false';
        this.busy = false;
        this.abortController = new AbortController();

        if (!this.form || !this.email || !this.submit || !this.status) return;

        var signal = this.abortController.signal;

        this.submit.addEventListener('click', this.onSubmit.bind(this), { signal: signal });
        this.email.addEventListener('keydown', this.onEmailKeydown.bind(this), { signal: signal });
        this.eventTarget.addEventListener('variant:update', this.onVariantUpdate.bind(this), { signal: signal });
        this.eventTarget.addEventListener('change', this.onVariantInputChange.bind(this), { signal: signal });

        this.applyVariant(this.getInitialVariant(), { preserveSubmitted: true });
        window.setTimeout(() => this.applyVariant(this.getInitialVariant(), { preserveSubmitted: true }), 250);
      }

      disconnectedCallback() {
        if (this.abortController) this.abortController.abort();
      }

      onEmailKeydown(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        this.onSubmit(e);
      }

      onVariantInputChange(e) {
        var target = e.target;
        if (!target?.closest?.('variant-picker, swatches-variant-picker-component')) return;
        window.setTimeout(() => this.applyVariant(this.getInitialVariant()), 0);
      }

      onVariantUpdate(e) {
        var detail = e.detail || {};
        var data = detail.data || {};
        var formProductId = this.productForm?.dataset.productId;

        if (data.productId && formProductId && data.productId !== formProductId && !data.newProduct) return;

        if (data.newProduct?.id && this.productForm) {
          this.productForm.dataset.productId = data.newProduct.id;
        }

        this.applyVariant(detail.resource || null);
      }

      getInitialVariant() {
        var idInput = this.productForm?.querySelector('input[name="id"]');
        var variantId = idInput?.value || this.dataset.variantId || '';
        var checkedOption = this.getCheckedVariantOption();

        if (checkedOption && (!variantId || checkedOption.dataset.variantId !== variantId)) {
          variantId = checkedOption.dataset.variantId || variantId;
          return {
            id: variantId,
            title: checkedOption.value || this.dataset.variant || '',
            available: checkedOption.dataset.optionAvailable === 'true',
          };
        }

        var variantJson = this.getVariantJson();

        if (variantJson && (!variantId || String(variantJson.id) === String(variantId))) {
          return variantJson;
        }

        var option = this.findVariantOption(variantId);
        if (option) {
          return {
            id: variantId,
            title: option.value || this.dataset.variant || '',
            available: option.dataset.optionAvailable === 'true',
          };
        }

        return {
          id: variantId,
          title: this.dataset.variant || '',
          available: this.buyState?.dataset.variantAvailable === 'true',
        };
      }

      getCheckedVariantOption() {
        var scope = this.closest('.shopify-section') || document;
        var checked = Array.prototype.slice.call(
          scope.querySelectorAll('input[type="radio"][data-option-available][data-variant-id]:checked')
        );

        if (checked.length === 1) return checked[0];

        checked = Array.prototype.slice.call(
          scope.querySelectorAll(
            'input[type="radio"][data-option-available][data-variant-id][data-current-checked="true"]'
          )
        );

        return checked.length === 1 ? checked[0] : null;
      }

      getVariantJson() {
        var scope = this.closest('.shopify-section') || document;
        var json = scope.querySelector(
          'variant-picker script[type="application/json"], swatches-variant-picker-component script[type="application/json"]'
        );

        if (!json?.textContent) return null;

        try {
          return JSON.parse(json.textContent);
        } catch (err) {
          return null;
        }
      }

      findVariantOption(variantId) {
        if (!variantId) return null;

        var scope = this.closest('.shopify-section') || document;
        return scope.querySelector(
          'input[type="radio"][data-option-available][data-variant-id="' + String(variantId).replace(/"/g, '\\"') + '"]'
        );
      }

      applyVariant(variant, options) {
        var preserveSubmitted = options?.preserveSubmitted === true;
        var variantId = variant?.id ? String(variant.id) : '';
        var variantTitle = variant?.title || variant?.public_title || this.dataset.variant || '';
        var isSoldOutVariant = !!variantId && variant.available === false;
        var variantChanged = variantId && variantId !== this.lastVariantId;

        if (variantId) {
          this.currentVariantId = variantId;
          this.dataset.variantId = variantId;
        }

        if (variantTitle) this.dataset.variant = variantTitle;
        if (this.buyState) {
          this.buyState.setAttribute('data-variant-available', isSoldOutVariant ? 'false' : 'true');
        }

        this.notifyVisible = isSoldOutVariant;

        if (variantChanged && !preserveSubmitted) {
          this.resetFormState();
        }

        if (this.notifyVisible && this.hasSessionSubmission(this.currentVariantId)) {
          this.submittedVariantId = this.currentVariantId;
        }

        if (!this.notifyVisible) {
          this.hideStatus();
          if (this.form) this.form.hidden = false;
        } else if (!this.endpoint) {
          this.showStatus('Notifications are temporarily unavailable.', true);
        } else if (this.submittedVariantId === this.currentVariantId) {
          if (this.form) this.form.hidden = true;
          this.showStatus("Thanks. We'll keep you updated.");
        } else if (this.form) {
          this.form.hidden = false;
        }

        this.lastVariantId = variantId || this.lastVariantId;
        this.updateControls();
      }

      setBusy(busy) {
        this.busy = busy;
        if (this.label) this.label.hidden = busy;
        if (this.loading) this.loading.hidden = !busy;
        this.updateControls();
      }

      updateControls() {
        var enabled = this.notifyVisible && !this.busy && this.submittedVariantId !== this.currentVariantId;

        if (this.email) this.email.disabled = !enabled;
        if (this.honeypot) this.honeypot.disabled = !enabled;
        if (this.submit) this.submit.disabled = !enabled || !this.endpoint;
      }

      showStatus(msg, isError) {
        this.status.textContent = msg;
        this.status.hidden = false;
        this.status.classList.toggle('notify-me__status--error', !!isError);
      }

      hideStatus() {
        if (!this.status) return;
        this.status.hidden = true;
        this.status.textContent = '';
        this.status.classList.remove('notify-me__status--error');
      }

      resetFormState() {
        this.setBusy(false);
        this.hideStatus();
        if (this.form) this.form.hidden = false;
        if (this.honeypot) this.honeypot.value = '';
      }

      completeSubmission() {
        this.submittedVariantId = this.currentVariantId;
        this.rememberSessionSubmission(this.currentVariantId);
        if (this.form) this.form.hidden = true;
        this.showStatus("Thanks. We'll keep you updated.");
      }

      getSubmissionCookieName(variantId) {
        return 'simms_notify_waitlist_' + encodeURIComponent(variantId || '');
      }

      hasSessionSubmission(variantId) {
        if (!variantId) return false;

        var cookieName = this.getSubmissionCookieName(variantId) + '=';

        return document.cookie.split(';').some(function (cookie) {
          return cookie.trim().indexOf(cookieName) === 0;
        });
      }

      rememberSessionSubmission(variantId) {
        if (!variantId) return;

        document.cookie = this.getSubmissionCookieName(variantId) + '=1; path=/; SameSite=Lax';
      }

      async onSubmit(e) {
        e.preventDefault();
        if (this.submit.disabled || !this.notifyVisible) return;

        if (!this.endpoint) {
          this.showStatus('Notifications are temporarily unavailable.', true);
          return;
        }

        var email = (this.email.value || '').trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          this.showStatus('Please enter a valid email.', true);
          this.email.focus();
          return;
        }

        if (this.honeypot?.value) {
          this.completeSubmission();
          this.updateControls();
          return;
        }

        var payload = {
          email: email,
          product: this.dataset.product,
          product_handle: this.dataset.productHandle,
          variant: this.dataset.variant,
          variant_id: this.currentVariantId,
          url: window.location.href,
          website: this.honeypot?.value || '',
        };

        this.setBusy(true);
        this.status.hidden = true;

        var requestController = new AbortController();
        var timeoutId = window.setTimeout(function () {
          requestController.abort();
        }, 10000);

        try {
          await fetch(this.endpoint, {
            method: 'POST',
            mode: 'no-cors',
            credentials: 'omit',
            signal: requestController.signal,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          });

          this.completeSubmission();
        } catch (err) {
          this.showStatus('Could not send. Please try again in a moment.', true);
        } finally {
          window.clearTimeout(timeoutId);
          this.setBusy(false);
        }
      }
    }
  );
}
