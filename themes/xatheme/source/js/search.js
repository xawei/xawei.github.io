document.addEventListener('DOMContentLoaded', function () {
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchButtons = document.querySelectorAll('.search-button');
    const closeBtn = document.getElementById('search-close-btn');
    const modalOverlay = document.querySelector('.search-modal-overlay');

    let searchData = [];
    let isDataLoaded = false;
    let selectedIndex = -1;

    // Show Modal
    function showModal() {
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        searchInput.focus();

        if (!isDataLoaded) {
            fetchSearchData();
        }
    }

    // Hide Modal
    function hideModal() {
        searchModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        searchInput.value = '';
        renderEmptyState();
        selectedIndex = -1;
    }

    // Fetch Search JSON
    function fetchSearchData() {
        fetch('/search.json')
            .then(response => response.json())
            .then(data => {
                searchData = data;
                isDataLoaded = true;
            })
            .catch(err => {
                console.error('Failed to load search data', err);
                searchResults.innerHTML = '<div class="search-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load search data.</p></div>';
            });
    }

    // Highlight keyword in text
    function highlightKeyword(text, keyword) {
        if (!keyword || !text) return text;
        const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    // Perform Search
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        selectedIndex = -1; // Reset selection on new search

        if (!query) {
            renderEmptyState();
            return;
        }

        if (!isDataLoaded) {
            searchResults.innerHTML = '<div class="search-empty-state"><p>Loading...</p></div>';
            return;
        }

        const results = searchData.filter(post => {
            const titleMatch = post.title && post.title.toLowerCase().includes(query);
            const contentMatch = post.content && post.content.toLowerCase().includes(query);
            return titleMatch || contentMatch;
        });

        renderResults(results, query);
    }

    // Render Results
    function renderResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-empty-state">
                    <i class="fa-regular fa-face-frown"></i>
                    <p>No results found for "<strong>${query}</strong>"</p>
                </div>
            `;
            return;
        }

        let html = '<ul class="search-result-list">';
        results.forEach((post, index) => {
            const title = highlightKeyword(post.title || 'Untitled', query);
            
            // Extract a snippet around the keyword
            let contentSnippet = '';
            if (post.content) {
                const lowerContent = post.content.toLowerCase();
                const matchIndex = lowerContent.indexOf(query);
                if (matchIndex !== -1) {
                    const start = Math.max(0, matchIndex - 40);
                    const end = Math.min(post.content.length, matchIndex + query.length + 40);
                    let snippet = post.content.substring(start, end);
                    if (start > 0) snippet = '...' + snippet;
                    if (end < post.content.length) snippet = snippet + '...';
                    contentSnippet = highlightKeyword(snippet, query);
                } else {
                    contentSnippet = post.content.substring(0, 100) + '...';
                }
            }

            html += `
                <li class="search-result-item" data-index="${index}">
                    <a href="${post.url}">
                        <div class="search-result-title">${title}</div>
                        <div class="search-result-content">${contentSnippet}</div>
                    </a>
                </li>
            `;
        });
        html += '</ul>';
        searchResults.innerHTML = html;
        
        // Add hover events for items
        const items = searchResults.querySelectorAll('.search-result-item');
        items.forEach((item, idx) => {
            item.addEventListener('mouseenter', () => {
                updateSelection(idx);
            });
        });
    }

    // Render Empty State
    function renderEmptyState() {
        searchResults.innerHTML = `
            <div class="search-empty-state">
                <i class="fa-regular fa-file-lines"></i>
                <p>Start typing to search...</p>
            </div>
        `;
    }

    // Update Keyboard Selection
    function updateSelection(index) {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        // Remove old selection
        if (selectedIndex >= 0 && selectedIndex < items.length) {
            items[selectedIndex].classList.remove('selected');
        }

        // Apply new selection
        selectedIndex = index;
        if (selectedIndex < 0) selectedIndex = items.length - 1;
        if (selectedIndex >= items.length) selectedIndex = 0;

        items[selectedIndex].classList.add('selected');
        
        // Scroll into view
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }

    // Event Listeners
    searchButtons.forEach(btn => btn.addEventListener('click', showModal));
    closeBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);

    // Escape to close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            hideModal();
        }

        // Cmd+K or Ctrl+K to open search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (searchModal.classList.contains('active')) {
                hideModal();
            } else {
                showModal();
            }
        }
    });

    // Search input typing
    searchInput.addEventListener('input', performSearch);

    // Keyboard navigation in search results
    searchInput.addEventListener('keydown', function(e) {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateSelection(selectedIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateSelection(selectedIndex - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                const link = items[selectedIndex].querySelector('a').href;
                window.location.href = link;
            } else if (items.length > 0) {
                const link = items[0].querySelector('a').href;
                window.location.href = link;
            }
        }
    });
});