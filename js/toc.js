document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages that have a TOC
  const tocContainer = document.querySelector('.toc-container');
  if (!tocContainer) return;

  const tocSticky = document.querySelector('.toc-sticky');
  const tocToggle = document.querySelector('.toc-toggle');
  const progressBar = document.querySelector('.toc-progress-bar');
  const tocLinks = document.querySelectorAll('.toc-link');
  const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6');
  
  // Check if TOC collapsed state is stored in localStorage
  const isTocCollapsed = localStorage.getItem('tocCollapsed') === 'true';
  if (isTocCollapsed) {
    tocSticky.classList.add('collapsed');
  }

  // Toggle TOC collapse/expand
  if (tocToggle) {
    tocToggle.addEventListener('click', function() {
      tocSticky.classList.toggle('collapsed');
      // Store collapsed state in localStorage
      localStorage.setItem('tocCollapsed', tocSticky.classList.contains('collapsed'));
    });
  }

  // Mobile detection and auto-collapse for small screens
  function checkMobileCollapse() {
    const isMobile = window.innerWidth <= 768;
    // Only auto-collapse if user hasn't explicitly set a preference
    if (isMobile && localStorage.getItem('tocCollapsed') === null) {
      tocSticky.classList.add('collapsed');
    } else if (!isMobile && localStorage.getItem('tocCollapsed') === null) {
      tocSticky.classList.remove('collapsed');
    }
  }

  // Check on load and resize
  checkMobileCollapse();
  window.addEventListener('resize', checkMobileCollapse);

  // Set active TOC link based on scroll position
  function setActiveTocLink() {
    if (!headings.length) return;

    // Get current scroll position with offset for fixed header
    const headerHeight = document.querySelector('.banner')?.offsetHeight || 70;
    const scrollPosition = window.scrollY + headerHeight + 20;

    // Find the current heading
    let currentHeadingIndex = -1;
    headings.forEach((heading, index) => {
      if (heading.offsetTop <= scrollPosition) {
        currentHeadingIndex = index;
      }
    });

    // Remove active class from all TOC links
    tocLinks.forEach(link => {
      link.classList.remove('active');
    });

    // If we found a heading, set its TOC link as active
    if (currentHeadingIndex !== -1) {
      const currentHeading = headings[currentHeadingIndex];
      const headingId = currentHeading.id;
      const correspondingTocLink = document.querySelector(`.toc-link[href="#${headingId}"]`);
      
      if (correspondingTocLink) {
        correspondingTocLink.classList.add('active');
        
        // Find all parent TOC items and highlight them too
        let parent = correspondingTocLink.closest('.toc-item');
        while (parent && parent.parentElement) {
          if (parent.parentElement.classList.contains('toc-content')) {
            break;
          }
          parent = parent.parentElement.closest('.toc-item');
          if (parent) {
            const parentLink = parent.querySelector(':scope > .toc-link');
            if (parentLink) {
              parentLink.classList.add('active');
            }
          }
        }
        
        // Auto-scroll the active link into view in the TOC if not collapsed
        if (!tocSticky.classList.contains('collapsed')) {
          const tocContent = document.querySelector('.toc-content');
          const linkTop = correspondingTocLink.offsetTop;
          const tocHeight = tocContent.clientHeight;
          
          if (linkTop < tocContent.scrollTop || linkTop > tocContent.scrollTop + tocHeight) {
            tocContent.scrollTo({
              top: linkTop - tocHeight / 2,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }

  // Update progress indicator
  function updateProgressIndicator() {
    if (!progressBar) return;

    // Calculate reading progress
    const contentHeight = document.querySelector('.post-content').offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollableHeight = contentHeight - windowHeight;
    
    // Calculate percentage of scroll progress
    let progress = (scrollPosition / scrollableHeight) * 100;
    
    // Limit to valid range
    progress = Math.min(Math.max(progress, 0), 100);
    
    // Update progress indicator height
    progressBar.style.height = `${progress}%`;
  }

  // Handle smooth scrolling when clicking TOC links
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Get header height for offset
        const headerHeight = document.querySelector('.banner')?.offsetHeight || 70;
        
        // Smooth scroll to target with offset
        window.scrollTo({
          top: targetElement.offsetTop - headerHeight - 20,
          behavior: 'smooth'
        });
        
        // Highlight target temporarily
        targetElement.classList.add('anchor-highlight');
        setTimeout(() => {
          targetElement.classList.remove('anchor-highlight');
        }, 2000);
        
        // On mobile, don't auto-collapse to keep TOC visible during scrolling
        if (window.innerWidth <= 768 && tocSticky.classList.contains('collapsed')) {
          tocSticky.classList.remove('collapsed');
          localStorage.setItem('tocCollapsed', 'false');
        }
      }
    });
  });

  // Add scroll event listeners
  window.addEventListener('scroll', function() {
    // Use requestAnimationFrame to optimize performance
    window.requestAnimationFrame(function() {
      setActiveTocLink();
      updateProgressIndicator();
    });
  });

  // Initial call to set correct state on page load
  setActiveTocLink();
  updateProgressIndicator();
  
  // Allow clicking anywhere on collapsed TOC to expand it
  tocSticky.addEventListener('click', function(e) {
    if (tocSticky.classList.contains('collapsed') && e.target !== tocToggle && !tocToggle.contains(e.target)) {
      tocSticky.classList.remove('collapsed');
      localStorage.setItem('tocCollapsed', 'false');
    }
  });
  
  // Force update TOC position and active state when window is resized
  window.addEventListener('resize', function() {
    setActiveTocLink();
    updateProgressIndicator();
  });
}); 