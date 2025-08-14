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

    const idFromHref = (a) => a.getAttribute('href').slice(1);
    const linkById = new Map(navLinks.map(a => [idFromHref(a), a]));

    const sections = navLinks
      .map(a => document.getElementById(idFromHref(a)))
      .filter(Boolean);

    function setActive(id) {
      linkById.forEach((a, key) => {
        const isMatch = key === id;
        a.classList.toggle('active', isMatch);
      });
    }

    // If there is a hash on load, set it immediately; else pick the first section
    function setInitialActive() {
      const hash = (location.hash || '').replace('#', '');
      if (hash && linkById.has(hash)) {
        setActive(hash);
      } else if (sections.length) {
        setActive(sections[0].id);
      }
    }

    // IntersectionObserver that chooses the MOST VISIBLE section
    const headerOffset = 90; // keep in sync with CSS scroll padding
    if ('IntersectionObserver' in window) {
      const ratios = new Map(); // id -> latest intersectionRatio

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          ratios.set(entry.target.id, entry.intersectionRatio);
        });

        // find the id with max ratio
        let bestId = null;
        let bestRatio = 0;
        ratios.forEach((r, id) => {
          if (r > bestRatio) { bestRatio = r; bestId = id; }
        });
        if (bestId) setActive(bestId);
      }, {
        root: null,
        threshold: [0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 0.95],
        // move the "viewport top" down to avoid the fixed header and bias to upper-middle of screen
        rootMargin: `-${headerOffset}px 0px -40% 0px`
      });

      sections.forEach(sec => observer.observe(sec));

      setInitialActive();

      // also update on hashchange (e.g., clicking nav quickly)
      window.addEventListener('hashchange', () => {
        const id = (location.hash || '').replace('#', '');
        if (id && linkById.has(id)) setActive(id);
      });
    } else {
      // Fallback: simple scroll position check
      function onScrollFallback() {
        let currentId = sections[0]?.id || '';
        const y = window.scrollY + headerOffset + 1;
        sections.forEach(sec => {
          if (sec.offsetTop <= y) currentId = sec.id;
        });
        if (currentId) setActive(currentId);
      }
      onScrollFallback();
      window.addEventListener('scroll', onScrollFallback, { passive: true });
      window.addEventListener('resize', onScrollFallback, { passive: true });
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
