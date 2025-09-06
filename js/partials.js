// js/partials.js
// Ensure Bootstrap Icons CSS is loaded once (for all pages using partials.js)
(function ensureIconStyles() {
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
  // ─── Compute “base” so all links/images point to your repo root ───
  // e.g. "/LIS-Quiz/" on GitHub Pages, or "/" on a custom domain/local
  const pathParts = window.location.pathname.split('/');
  const repoName  = pathParts[1];                // "LIS-Quiz" when hosted
  const base      = repoName ? `/${repoName}/` : '/';

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
          <li><a href="https://www.instagram.com/loyal.int.school?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" title="Instagram"><i class="bi bi-instagram icon" aria-hidden="true"></i><span>Instagram</span></a></li>
        </ul>
      </section>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 Loyal's M.C.Q/Innovative model building. All rights reserved.</p>
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
