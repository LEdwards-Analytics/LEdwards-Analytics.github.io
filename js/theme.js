(function () {
  const KEY = 'site-theme';
  const ICON_ID = 'theme-icon';

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
    // Put .dark on <html> so all selectors like ".dark header" keep working
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    // Sync optional body class for any body-scoped rules
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

  function init() {
    // Determine initial theme (respect stored; else system)
    let stored = getStored();
    let theme = stored ? stored : (prefersDark() ? 'dark' : 'light');
    applyTheme(theme);

    // Click handler
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
      mq.addEventListener('change', (e) => {
        const next = e.matches ? 'dark' : 'light';
        applyTheme(next);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
