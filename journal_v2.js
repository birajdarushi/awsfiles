// journal_v2.js - interactive behaviors for perspective journal
(() => {
  const q = (s, p=document) => p.querySelector(s);
  const qa = (s, p=document) => Array.from(p.querySelectorAll(s));

  const sidebar = q('#sidebar');
  const navToggle = q('#navToggle');
  const progressBar = q('#progressBar');
  const searchInput = q('#searchInput');
  const categoryFilters = q('#categoryFilters');
  const perspectiveLinks = qa('#perspectiveNav a');
  const sections = qa('.pv-section');
  const emptyState = q('#emptyState');
  const toggleModeBtn = q('#toggleMode');
  const toggleCompactBtn = q('#toggleCompact');
  const scrollTopBtn = q('#scrollTop');

  let currentCategory = 'all';
  let searchTerm = '';
  let compact = false;

  // Navigation toggle (mobile)
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    sidebar.classList.toggle('open');
  });

  // Reading progress
  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Intersection highlight for perspective nav
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        perspectiveLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach(sec => observer.observe(sec));

  // Category filtering
  categoryFilters?.addEventListener('click', e => {
    const btn = e.target.closest('.pv-pill');
    if (!btn) return;
    qa('.pv-pill', categoryFilters).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    applyFilters();
  });

  // Search with debounce
  let searchTimer;
  searchInput?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFilters();
    }, 160);
  });

  // Highlight search matches in element text
  const highlightMatches = (el, term) => {
    // avoid code blocks
    if (el.closest('pre, code')) return;
    const original = el.getAttribute('data-original-text') || el.textContent;
    if (!el.getAttribute('data-original-text')) {
      el.setAttribute('data-original-text', original);
    }
    if (!term) {
      el.innerHTML = original; return;
    }
    const safe = original.replace(/</g,'&lt;');
    const regex = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    el.innerHTML = safe.replace(regex, '<mark class="pv-hit">$1</mark>');
  };

  function applyFilters() {
    let visibleCount = 0;
    sections.forEach(section => {
      let sectionVisible = false;
      const blocks = qa('.pv-block', section);
      blocks.forEach(block => {
        const categories = (block.dataset.category || '').split(/\s+/);
        const categoryMatch = currentCategory === 'all' || categories.includes(currentCategory);
        const text = block.textContent.toLowerCase();
        const searchMatch = !searchTerm || text.includes(searchTerm);
        if (categoryMatch && searchMatch) {
          block.style.display = '';
          visibleCount++;
          sectionVisible = true;
          // highlight paragraphs + headings
          qa('p, li, h3, h4', block).forEach(el => highlightMatches(el, searchTerm));
        } else {
          block.style.display = 'none';
        }
      });
      section.dataset.hidden = sectionVisible ? 'false' : 'true';
    });
    emptyState.classList.toggle('show', visibleCount === 0);
  }
  applyFilters();

  // Theme toggle
  const savedMode = localStorage.getItem('pv-theme');
  if (savedMode === 'light') document.body.classList.add('light-mode');
  toggleModeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('pv-theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  });

  // Compact toggle (reduce spacing)
  toggleCompactBtn?.addEventListener('click', () => {
    compact = !compact;
    document.body.classList.toggle('pv-compact', compact);
    toggleCompactBtn.innerHTML = compact ? '<i class="fa-solid fa-expand"></i> Normal' : '<i class="fa-solid fa-compress"></i> Compact';
  });

  // Scroll to top
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault(); searchInput.focus();
    }
    if (e.key === 'Escape') {
      searchInput.blur();
    }
  });
})();
