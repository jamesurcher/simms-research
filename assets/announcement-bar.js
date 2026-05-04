import { Component } from '@theme/component';

/**
 * Announcement banner custom element that allows fading between content.
 * Based on the Slideshow component.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} slideshowContainer
 * @property {HTMLElement[]} [slides]
 * @property {HTMLButtonElement} [previous]
 * @property {HTMLButtonElement} [next]
 *
 * @extends {Component<Refs>}
 */
export class AnnouncementBar extends Component {
  #current = 0;

  /**
   * The interval ID for automatic playback.
   * @type {number|undefined}
   */
  #interval = undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('mouseenter', this.suspend);
    this.addEventListener('mouseleave', this.resume);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);

    this.play();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.suspend();
    this.removeEventListener('mouseenter', this.suspend);
    this.removeEventListener('mouseleave', this.resume);
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
  }

  next() {
    this.current += 1;
  }

  previous() {
    this.current -= 1;
  }

  /**
   * Starts automatic slide playback.
   * @param {number} [interval] - The time interval in seconds between slides.
   */
  play(interval = this.autoplayInterval) {
    if (!this.autoplay) return;

    this.paused = false;
    this.suspend();

    this.#interval = setInterval(() => {
      if (this.matches(':hover') || document.hidden) return;

      this.next();
    }, interval);
  }

  /**
   * Pauses automatic slide playback.
   */
  pause() {
    this.paused = true;
    this.suspend();
  }

  get paused() {
    return this.hasAttribute('paused');
  }

  set paused(paused) {
    this.toggleAttribute('paused', paused);
  }

  /**
   * Suspends automatic slide playback.
   */
  suspend() {
    clearInterval(this.#interval);
    this.#interval = undefined;
  }

  /**
   * Resumes automatic slide playback if autoplay is enabled.
   */
  resume() {
    if (!this.autoplay || this.paused) return;

    this.play();
  }

  get autoplay() {
    return Boolean(this.autoplayInterval);
  }

  get autoplayInterval() {
    const interval = this.getAttribute('autoplay');
    const value = parseInt(`${interval}`, 10);

    if (Number.isNaN(value)) return undefined;

    return value * 1000;
  }

  get current() {
    return this.#current;
  }

  set current(current) {
    const slides = this.refs.slides ?? [];

    if (!slides.length) return;

    this.#current = current;

    let relativeIndex = current % slides.length;
    if (relativeIndex < 0) {
      relativeIndex += slides.length;
    }

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', `${index !== relativeIndex}`);
    });
  }

  /**
   * Pause the slideshow when the page is hidden.
   */
  #handleVisibilityChange = () => (document.hidden ? this.suspend() : this.resume());
}

if (!customElements.get('announcement-bar-component')) {
  customElements.define('announcement-bar-component', AnnouncementBar);
}
