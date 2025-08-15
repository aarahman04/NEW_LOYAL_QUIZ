// js/partials.js

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
              <li><a href="${base}index.html">Home</a></li>
              <li><a href="#levels">Levels</a></li>
              <li><a href="${base}pages/contactus.html">Contact</a></li>
            </ul>
          </nav>
        </section>
        <section class="footer-section">
          <h4>Contact Us</h4>
          <address>
            Uthman Ibn Al-Yaman Street<br/>
            Jeddah, Saudi Arabia<br/>
            <a href="mailto:loyal.int.school@gmail.com">loyal.int.school@gmail.com</a><br/>
            <a href="tel:+966548953829">+966 54 895 3829</a>
          </address>
        </section>
        <section class="footer-section social">
          <h4>Follow Us</h4>
          <ul class="social-links" aria-label="Social Media">
            <li><a href="#" title="Twitter">🐦 Twitter</a></li>
            <li><a href="#" title="Facebook">📘 Facebook</a></li>
            <li><a href="#" title="Instagram">📸 Instagram</a></li>
          </ul>
        </section>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 Loyal's MCQ. All rights reserved.</p>
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