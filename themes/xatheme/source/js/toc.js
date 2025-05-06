document.addEventListener('DOMContentLoaded', function() {
    // Only run on pages with TOC
    const tocContainer = document.querySelector('.toc-container');
    if (!tocContainer) return;

    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    // Get all TOC links and content headings
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.post-content h1[id], .post-content h2[id], .post-content h3[id], .post-content h4[id], .post-content h5[id], .post-content h6[id]');
    
    if (!headings.length || !tocLinks.length) return;

    // Track the current active heading
    let activeHeadingId = null;
    
    // Create the Intersection Observer
    const observer = new IntersectionObserver(
        (entries) => {
            // Get all headings that are currently visible
            const visibleHeadings = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => entry.target);
            
            // If no headings are visible, keep the last active heading
            if (visibleHeadings.length === 0) return;
            
            // Get the first visible heading (topmost in view)
            const firstVisibleHeading = visibleHeadings[0];
            
            // Skip if this is already the active heading
            if (firstVisibleHeading.id === activeHeadingId) return;
            
            // Update the active heading
            activeHeadingId = firstVisibleHeading.id;
            
            // Remove active class from all links
            tocLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to the corresponding TOC link
            const activeLink = document.querySelector(`.toc-link[href="#${activeHeadingId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        },
        {
            // Start detecting when element is 30% visible
            threshold: 0.3,
            // Add a root margin to trigger a bit earlier
            rootMargin: '-80px 0px -70% 0px'
        }
    );
    
    // Observe all headings
    headings.forEach(heading => observer.observe(heading));
    
    // Handle click on TOC links for smooth scrolling
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Get header height
                const headerHeight = document.querySelector('.banner')?.offsetHeight || 80;
                
                // Smooth scroll with offset
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight - 20,
                    behavior: 'smooth'
                });
                
                // Update URL hash
                history.pushState(null, null, link.getAttribute('href'));
            }
        });
    });
}); 