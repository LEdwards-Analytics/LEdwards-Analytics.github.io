(function () {
  const KEY = 'site-theme';
  const ICON_ID = 'theme-icon';

  /* =======================
     Theme helpers
  ======================= */
  function getStored() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function setStored(val) {
    try { localStorage.setItem(KEY, val); } catch (_) {}
  }
  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(theme) {
    // Put .dark on <html> so selectors like ".dark header" work
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    // Optional body mirror (harmless if unused)
    if (theme === 'dark') document.body.classList.add('dark'); else document.body.classList.remove('dark');
    updateIcon(theme);
  }
  function updateIcon(theme) {
    const icon = document.getElementById(ICON_ID);
    if (!icon) return;
    icon.classList.remove('fa-sun', 'fa-moon');
    icon.classList.add(theme === 'dark' ? 'fa-moon' : 'fa-sun');
    const btn = icon.closest('#theme-toggle');
    if (btn) {
      const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  }

  /* =======================
     Active-link underline
  ======================= */
  function setupActiveNavHighlight() {
    // Only consider in-page links in the main nav
    const navLinks = Array.from(document.querySelectorAll('nav a.nav-link[href^="#"]'));
    if (!navLinks.length) return;

    const sections = navLinks
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    function setActive(id) {
      navLinks.forEach(a => {
        const isMatch = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('active', isMatch);
      });
    }

    // Prefer IntersectionObserver for accurate, smooth updates
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, {
        root: null,
        threshold: 0.55,               // >50% visible counts as active
        rootMargin: '-90px 0px 0px 0px' // compensates for fixed header height
      });

      sections.forEach(sec => observer.observe(sec));
    } else {
      // Fallback: simple scroll position check
      const headerOffset = 90;
      function onScrollFallback() {
        let currentId = '';
        const y = window.scrollY + headerOffset + 1;
        sections.forEach(sec => {
          if (sec.offsetTop <= y) currentId = sec.id;
        });
        if (currentId) setActive(currentId);
      }
      onScrollFallback();
      window.addEventListener('scroll', onScrollFallback, { passive: true });
    }
  }

  /* =======================
     Init
  ======================= */
  function init() {
    // Determine initial theme (respect stored; else system)
    let stored = getStored();
    let theme = stored ? stored : (prefersDark() ? 'dark' : 'light');
    applyTheme(theme);

    // Theme toggle click
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setStored(next);
      });
    }

    // Sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === KEY && e.newValue) applyTheme(e.newValue);
    });

    // Follow system *only if user hasn't set a preference*
    if (!stored && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => applyTheme(e.matches ? 'dark' : 'light'));
    }

    // Activate nav underline tracking
    setupActiveNavHighlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
