    const productsPerPage = 9;
    let currentPage = 1;
    let currentCategory = 'all';
    let searchTerm = '';

    // CHANGED: Use hyphens in search URL and decode on read
    function getSearchFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('search') || '';
      return raw.replace(/-/g, ' ');
    }
    function getPageFromQuery() {
      const params = new URLSearchParams(window.location.search);
      return parseInt(params.get('page')) || 1;
    }

    // On page load, set search term and page from URL if present
    const initialSearch = getSearchFromQuery();
    const initialPage = getPageFromQuery();
    if (initialSearch) {
      document.getElementById('searchBar').value = initialSearch;
      searchTerm = initialSearch;
    }
    currentPage = initialPage;

    function filterProducts() {
      let filtered = products;

      // Category filter
      if (currentCategory !== 'all') {
        filtered = filtered.filter(p =>
          Array.isArray(p.category)
            ? p.category.includes(currentCategory)
            : (typeof p.category === "string" && p.category.toLowerCase() === currentCategory)
        );
      }

      // Search filter (multi-word, all words must match)
      if (searchTerm.trim() !== '') {
        const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
        filtered = filtered.filter(p => {
          let searchable = [
            p.title || '',
            Array.isArray(p.category) ? p.category.join(' ') : (p.category || ''),
            p.discount || ''
          ].join(' ').toLowerCase();
          return words.every(word => searchable.includes(word));
        });
      }

      return filtered;
    }

    // CHANGED: Use hyphens instead of %20 in search URL
    function updateURL(page, searchTerm) {
      let params = [];
      if (searchTerm && searchTerm.trim() !== '') {
        const cleanSearch = searchTerm.trim().toLowerCase().replace(/\s+/g, '-');
        params.push('search=' + cleanSearch);
      }
      if (page > 1) {
        params.unshift('page=' + page); // page first, then search
      }
      const query = params.length ? '?' + params.join('&') : '';
      window.history.replaceState({}, '', '/' + query);
    }

    function renderProducts(filter = currentCategory, page = 1, search = searchTerm) {
      currentCategory = filter;
      currentPage = page;
      searchTerm = search;
      const grid = document.getElementById('productGrid');
      grid.innerHTML = '';

      let filtered = filterProducts();

      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.2rem;">No products found.</div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
      }

      const totalPages = Math.ceil(filtered.length / productsPerPage);
      const start = (page - 1) * productsPerPage;
      const end = start + productsPerPage;
      const paginatedItems = filtered.slice(start, end);

      paginatedItems.forEach(p => {
        // Show all categories as comma-separated, capitalized
        const categories = Array.isArray(p.category)
          ? p.category.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)).join(', ')
          : (p.category.charAt(0).toUpperCase() + p.category.slice(1));

        grid.innerHTML += `
          <a class="card-link-wrapper" href="${p.link}" target="_blank" rel="noopener">
            <div class="card">
              <div class="card-image-area">
                <img src="${p.image}" alt="${p.title}"
                  onerror="this.onerror=null;this.src='https://via.placeholder.com/320x320?text=No+Image';">
                ${p.discount ? `<span class="discount-tag">${p.discount}</span>` : ''}
              </div>
              <div class="card-body">
                <div>
                  <div class="card-title">${p.title}</div>
                  <div class="card-category">${categories}</div>
                  <div class="card-price">${p.price}</div>
                </div>
                <span class="card-link-btn">View on Amazon</span>
              </div>
            </div>
          </a>
        `;
      });

      renderPagination(totalPages, page);
    }

    function renderPagination(totalPages, currentPage) {
      const pagination = document.getElementById('pagination');
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      let buttons = '';

      // Prev button
      buttons += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button> `;

      // Show up to 5 page numbers, with truncation if needed
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

      for (let i = startPage; i <= endPage; i++) {
        buttons += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button> `;
      }

      // Next button
      buttons += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
      pagination.innerHTML = buttons;
    }

    // Expose changePage globally for inline onclick
    window.changePage = function(page) {
      if (page < 1) return;
      currentPage = page;
      updateURL(currentPage, searchTerm);
      renderProducts(currentCategory, currentPage, searchTerm);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // This scrolls to the top smoothly
    }

    // Filter buttons
    document.querySelectorAll('.filters button[data-category]').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filters button[data-category]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        currentPage = 1;
        updateURL(currentPage, searchTerm);
        renderProducts(currentCategory, 1, searchTerm);
      });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', function() {
      document.querySelectorAll('.filters button[data-category]').forEach(b => b.classList.remove('active'));
      document.querySelector('.filters button[data-category="all"]').classList.add('active');
      currentCategory = 'all';
      document.getElementById('searchBar').value = '';
      searchTerm = '';
      currentPage = 1;
      updateURL(currentPage, searchTerm);
      renderProducts('all', 1, '');
    });

    // Search bar event (live search + update URL)
    document.getElementById('searchBar').addEventListener('input', function(e) {
      searchTerm = e.target.value;
      currentPage = 1;
      updateURL(currentPage, searchTerm);
      renderProducts(currentCategory, 1, searchTerm);
    });

    // Search bar event (on Enter: search and hide keyboard)
    document.getElementById('searchBar').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchTerm = e.target.value;
        currentPage = 1;
        updateURL(currentPage, searchTerm);
        renderProducts(currentCategory, 1, searchTerm);
        e.target.blur(); // Hide keyboard on mobile
      }
    });

    // Initial render
    renderProducts(currentCategory, currentPage, searchTerm);