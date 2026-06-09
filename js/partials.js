// js/partials.js

// ─── Site root, derived from THIS script's own URL ───────────────────
// Robust across every hosting style: local servers, file://, custom
// domains, and GitHub Pages project subdirectories. partials.js always
// lives at "<root>/js/partials.js", so stripping that tail yields the
// root that every header/footer link & image should be built from.
const PARTIALS_ROOT = (function () {
  const self =
    document.currentScript ||
    Array.prototype.slice
      .call(document.getElementsByTagName('script'))
      .filter((s) => /(^|\/)js\/partials\.js(\?|#|$)/.test(s.getAttribute('src') || ''))
      .pop();
  if (self && self.src) {
    return self.src.replace(/js\/partials\.js.*$/, '');
  }
  // Fallback: site root
  return '/';
})();

// Ensure favicon + Bootstrap Icons CSS are loaded once (for all pages).
(function ensureIconStyles() {
  // ── Favicons (path-safe for every nested page via PARTIALS_ROOT) ──
  if (!document.getElementById('site-favicons')) {
    const fav = PARTIALS_ROOT + 'favicon/';
    const icons = [
      ['icon', 'image/svg+xml', fav + 'favicon.svg', null],
      ['icon', 'image/png', fav + 'favicon-96x96.png', '96x96'],
      ['shortcut icon', null, fav + 'favicon.ico', null],
      ['apple-touch-icon', null, fav + 'apple-touch-icon.png', '180x180'],
      ['manifest', null, fav + 'site.webmanifest', null],
    ];
    icons.forEach(([rel, type, href, sizes], i) => {
      const l = document.createElement('link');
      if (i === 0) l.id = 'site-favicons';
      l.rel = rel;
      if (type) l.type = type;
      if (sizes) l.sizes = sizes;
      l.href = href;
      document.head.appendChild(l);
    });
  }

  const CDN_ID = 'bi-icons-cdn';
  if (!document.getElementById(CDN_ID)) {
    const link = document.createElement('link');
    link.id = CDN_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(link);
  }

  // Small helper styles for footer links & icons (optional; keeps it self-contained)
  const STYLE_ID = 'partials-footer-icon-style';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .site-footer .social-links,
      .site-footer .footer-links { list-style: none; padding: 0; margin: 0; }
      .site-footer .social-links li { margin: 6px 0; }
      .site-footer .social-links a,
      .site-footer address a {
        display: inline-flex; align-items: center; gap: 8px;
        text-decoration: none; color: inherit;
      }
      .site-footer .icon { font-size: 1.2rem; line-height: 1; vertical-align: -0.125em; }
      .site-footer a:hover { color: var(--brand, #2563eb); }
    `;
    document.head.appendChild(s);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // ─── Base for all header/footer links & images ───────────────────
  // Derived from this script's own location (see PARTIALS_ROOT above),
  // so assets resolve correctly no matter how deep the page is nested.
  const base = PARTIALS_ROOT;

  // ─── 1) HEADER + HAMBURGER ─────────────────────────────────────────
  const headerHtml = `
    <header class="site-header">
      <div class="header-inner">
        <div class="logo">
          <a href="${base}index.html" class="logo-link">
            <img
              src="${base}image/Loyal_International_School_logo.png"
              class="logo-icon"
              alt="Loyal's MCQ logo"
            />
            <span class="logo-text">Loyal's MCQ</span>
          </a>
        </div>

        <!-- Hamburger icon (≤900px only) -->
        <div class="hamburger" id="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <!-- Main navigation -->
        <nav class="main-nav" id="nav-menu">
          <a href="${base}index.html"           class="nav-link">Home</a>
          <a href="${base}pages/aboutus.html"   class="nav-link">About Us</a>
          <a href="${base}pages/contactus.html" class="nav-link">Contact</a>
        </nav>
      </div>
    </header>
  `;
  const headerEl = document.getElementById('site-header-placeholder');
  if (headerEl) headerEl.outerHTML = headerHtml;

// ─── 2) FOOTER ──────────────────────────────────────────────────────
const footerHtml = `
  <footer id="contact" class="site-footer">
    <div class="footer-inner">
      <section class="footer-section">
        <h4>Quick Links</h4>
        <nav aria-label="Quick Links">
          <ul class="footer-links">
            <li><a href="${base}index.html"><i class="bi bi-house-door icon" aria-hidden="true"></i><span>  Home</span></a></li>
            <li><a href="${base}pages/contactus.html"><i class="bi bi-envelope icon" aria-hidden="true"></i><span>  Contact</span></a></li>
            <li><a href="${base}pages/aboutus.html"><i class="bi bi-info-circle icon" aria-hidden="true"></i><span> About Us</span></a></li>

          </ul>
        </nav>
      </section>

      <section class="footer-section">
        <h4>Contact Us</h4>
        <address>
          Uthman Ibn Al-Yaman Street<br/>
          Jeddah, Saudi Arabia<br/>
          <a href="mailto:loyal.int.school@gmail.com">
            <i class="bi bi-envelope-fill icon" aria-hidden="true"></i><span>  loyal.int.school@gmail.com </span> 
          </a>
          <a href="tel:+966548953829">
            <i class="bi bi-telephone-fill icon" aria-hidden="true"></i><span>  +966 54 895 3829</span>
          </a>
        </address>
      </section>

      <section class="footer-section social">
        <h4>Follow Us</h4>
        <ul class="social-links" aria-label="Social Media">
          <li><a href="#" title="Twitter / X"><i class="bi bi-twitter-x icon" aria-hidden="true"></i><span>Twitter / X</span></a></li>
          <li><a href="#" title="Facebook"><i class="bi bi-facebook icon" aria-hidden="true"></i><span>Facebook</span></a></li>
          <li><a href="https://www.instagram.com/loyal.int.school?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" title="Instagram"><i class="bi bi-instagram icon" aria-hidden="true"></i><span>Instagram</span></a></li>
        </ul>
      </section>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Loyal's M.C.Q/Innovative Solutions by MAR. All rights reserved.</p>
    </div>
  </footer>
`;
const footerEl = document.getElementById('site-footer-placeholder');
if (footerEl) footerEl.outerHTML = footerHtml;



  // ─── 3) HAMBURGER MENU TOGGLE ───────────────────────────────────────
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('nav-menu');

  if (ham && nav) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('active');
      nav.classList.toggle('active');
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        ham.classList.remove('active');
        nav.classList.remove('active');
      });
    });
  }
});
