// Main Script for XATheme

document.addEventListener('DOMContentLoaded', function() {
    // Setup mobile menu
    setupMobileMenu();
    
    // Theme toggle
    setupThemeToggle();
    
    // Smooth scroll to anchors
    smoothScrollToAnchor();
    
    // Process code blocks for highlighting
    processCodeBlocks();
    
    // Add links and IDs to headings
    processHeadingLinks();
    
    // Active TOC link highlighting on scroll
    highlightTocOnScroll();
    
    // Setup copy buttons for code blocks
    setupCopyButtons();
    
    // Setup back to top button
    setupBackToTop();
    
    // Setup collapsible TOC
    setupTocCollapse();
});

/**
 * Process code blocks in the document
 * Using a more direct approach with Hexo's default output structure
 */
function processCodeBlocks() {
    // Process Hexo-generated figure.highlight blocks
    document.querySelectorAll('figure.highlight').forEach(function(figure) {
        // Skip if already processed
        if (figure.classList.contains('processed')) return;
        
        // Mark as processed
        figure.classList.add('processed');
        
        // Detect language from class
        let language = 'code';
        figure.classList.forEach(className => {
            if (className !== 'highlight' && className !== 'processed') {
                language = className;
            }
        });
        
        // Create header with tools
        const header = document.createElement('div');
        header.className = 'code-header';
        
        // Add language label
        const languageLabel = document.createElement('span');
        languageLabel.className = 'lang-label';
        languageLabel.textContent = language.toUpperCase();
        header.appendChild(languageLabel);
        
        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.title = 'Copy Code';
        header.appendChild(copyButton);
        
        // Add fold button for long code blocks
        const foldButton = document.createElement('button');
        foldButton.className = 'fold-button';
        foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        foldButton.title = 'Fold Code';
        header.appendChild(foldButton);
        
        // Insert header at the beginning of figure
        figure.insertBefore(header, figure.firstChild);
        
        // Get the code content
        const codeElement = figure.querySelector('td.code');
        
        // Set up copy button functionality
        copyButton.addEventListener('click', function() {
            const codeLines = Array.from(figure.querySelectorAll('td.code .line'))
                .map(line => line.textContent)
                .join('\n');
            
            navigator.clipboard.writeText(codeLines).then(function() {
                copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy code: ', err);
                copyButton.innerHTML = '<i class="fa-solid fa-times"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            });
        });
        
        // Set up fold button functionality
        foldButton.addEventListener('click', function() {
            if (figure.classList.contains('folded')) {
                figure.classList.remove('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                foldButton.title = 'Fold Code';
                // Hide the expand button wrapper
                const expandButtonWrapper = figure.querySelector('.expand-button-wrapper');
                if (expandButtonWrapper) {
                    expandButtonWrapper.style.display = 'none';
                }
                // Show show less button
                if (figure.querySelector('.collapse-button')) {
                    figure.querySelector('.collapse-button').style.display = 'flex';
                }
            } else {
                figure.classList.add('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
                // Show the expand button wrapper
                const expandButtonWrapper = figure.querySelector('.expand-button-wrapper');
                if (expandButtonWrapper) {
                    expandButtonWrapper.style.display = 'block';
                }
                // Hide show less button
                if (figure.querySelector('.collapse-button')) {
                    figure.querySelector('.collapse-button').style.display = 'none';
                }
            }
        });
        
        // Fold long code blocks by default
        const lineCount = figure.querySelectorAll('.line').length;
        if (lineCount > 15) {
            figure.classList.add('folded');
            foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            foldButton.title = 'Unfold Code';
            
            // Create a wrapper for the "Show more" button with a background
            const expandButtonWrapper = document.createElement('div');
            expandButtonWrapper.className = 'expand-button-wrapper';
            expandButtonWrapper.style.position = 'absolute';
            expandButtonWrapper.style.bottom = '0';
            expandButtonWrapper.style.left = '0';
            expandButtonWrapper.style.width = '100%';
            expandButtonWrapper.style.textAlign = 'center';
            expandButtonWrapper.style.zIndex = '7';
            
            // Add expand button
            const expandButton = document.createElement('button');
            expandButton.className = 'expand-button';
            expandButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Show more';
            expandButton.title = 'Expand Code';
            expandButton.style.display = 'flex';
            
            // Add the button to the wrapper, then add wrapper to figure
            expandButtonWrapper.appendChild(expandButton);
            figure.appendChild(expandButtonWrapper);
            
            // Add collapse button
            const collapseButton = document.createElement('button');
            collapseButton.className = 'collapse-button';
            collapseButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Show less';
            collapseButton.title = 'Collapse Code';
            collapseButton.style.display = 'none';
            figure.appendChild(collapseButton);
            
            // Set up expand button functionality
            expandButton.addEventListener('click', function() {
                figure.classList.remove('folded');
                expandButtonWrapper.style.display = 'none';
                collapseButton.style.display = 'flex';
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                foldButton.title = 'Fold Code';
            });
            
            // Set up collapse button functionality
            collapseButton.addEventListener('click', function() {
                figure.classList.add('folded');
                expandButtonWrapper.style.display = 'block';
                collapseButton.style.display = 'none';
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
            });
        }
    });
    
    // Handle plain <pre> code blocks (not generated by Hexo highlighter)
    document.querySelectorAll('pre:not(.highlight pre)').forEach(function(pre) {
        // Skip if already processed or inside a figure.highlight
        if (pre.classList.contains('processed') || pre.closest('figure.highlight')) return;
        
        // Mark as processed
        pre.classList.add('processed');
        
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        
        // Detect language from class
        let language = 'code';
        const codeElement = pre.querySelector('code');
        if (codeElement) {
            codeElement.classList.forEach(className => {
                if (className.startsWith('language-')) {
                    language = className.replace('language-', '');
                }
            });
        }
        
        // Create header with tools
        const header = document.createElement('div');
        header.className = 'code-header';
        
        // Add language label
        const languageLabel = document.createElement('span');
        languageLabel.className = 'lang-label';
        languageLabel.textContent = language.toUpperCase();
        header.appendChild(languageLabel);
        
        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.title = 'Copy Code';
        header.appendChild(copyButton);
        
        // Add fold button for long code blocks
        const foldButton = document.createElement('button');
        foldButton.className = 'fold-button';
        foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        foldButton.title = 'Fold Code';
        header.appendChild(foldButton);
        
        // Insert header before pre element
        wrapper.insertBefore(header, pre);
        
        // Set up copy button functionality
        copyButton.addEventListener('click', function() {
            const codeText = pre.textContent;
            
            navigator.clipboard.writeText(codeText).then(function() {
                copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy code: ', err);
                copyButton.innerHTML = '<i class="fa-solid fa-times"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            });
        });
        
        // Set up fold button functionality
        foldButton.addEventListener('click', function() {
            if (wrapper.classList.contains('folded')) {
                wrapper.classList.remove('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                foldButton.title = 'Fold Code';
                // Hide the expand button wrapper
                const expandButtonWrapper = wrapper.querySelector('.expand-button-wrapper');
                if (expandButtonWrapper) {
                    expandButtonWrapper.style.display = 'none';
                }
                // Show show less button
                if (wrapper.querySelector('.collapse-button')) {
                    wrapper.querySelector('.collapse-button').style.display = 'flex';
                }
            } else {
                wrapper.classList.add('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
                // Show the expand button wrapper
                const expandButtonWrapper = wrapper.querySelector('.expand-button-wrapper');
                if (expandButtonWrapper) {
                    expandButtonWrapper.style.display = 'block';
                }
                // Hide show less button
                if (wrapper.querySelector('.collapse-button')) {
                    wrapper.querySelector('.collapse-button').style.display = 'none';
                }
            }
        });
        
        // Fold long code blocks by default
        const lineCount = (pre.textContent.match(/\n/g) || []).length + 1;
        if (lineCount > 15) {
            wrapper.classList.add('folded');
            foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            foldButton.title = 'Unfold Code';
            
            // Create a wrapper for the "Show more" button with a background
            const expandButtonWrapper = document.createElement('div');
            expandButtonWrapper.className = 'expand-button-wrapper';
            expandButtonWrapper.style.position = 'absolute';
            expandButtonWrapper.style.bottom = '0';
            expandButtonWrapper.style.left = '0';
            expandButtonWrapper.style.width = '100%';
            expandButtonWrapper.style.textAlign = 'center';
            expandButtonWrapper.style.zIndex = '7';
            
            // Add expand button
            const expandButton = document.createElement('button');
            expandButton.className = 'expand-button';
            expandButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Show more';
            expandButton.title = 'Expand Code';
            expandButton.style.display = 'flex';
            
            // Add the button to the wrapper, then add wrapper to figure
            expandButtonWrapper.appendChild(expandButton);
            wrapper.appendChild(expandButtonWrapper);
            
            // Add collapse button
            const collapseButton = document.createElement('button');
            collapseButton.className = 'collapse-button';
            collapseButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Show less';
            collapseButton.title = 'Collapse Code';
            collapseButton.style.display = 'none';
            wrapper.appendChild(collapseButton);
            
            // Set up expand button functionality
            expandButton.addEventListener('click', function() {
                wrapper.classList.remove('folded');
                expandButtonWrapper.style.display = 'none';
                collapseButton.style.display = 'flex';
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                foldButton.title = 'Fold Code';
            });
            
            // Set up collapse button functionality
            collapseButton.addEventListener('click', function() {
                wrapper.classList.add('folded');
                expandButtonWrapper.style.display = 'block';
                collapseButton.style.display = 'none';
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
            });
        }
    });
}

/**
 * Process heading links in the article to add URL copy functionality
 */
function processHeadingLinks() {
    // Check if we're on the About page
    const isAboutPage = window.location.pathname.includes('/about/');
    
    // Select all headings in the post content
    const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6');
    
    headings.forEach(heading => {
        // Check if the heading already has an ID (from Hexo)
        if (!heading.id) {
            // Generate an ID if it doesn't have one
            const headingText = heading.textContent;
            
            // Use encodeURIComponent for all characters including Chinese
            const headingId = encodeURIComponent(headingText.trim())
                .toLowerCase()
                .replace(/%20/g, '-')     // Replace spaces (encoded as %20) with hyphens
                .replace(/%[0-9a-f]{2}/g, '') // Remove percent encodings
                .replace(/[^\w\-]+/g, '')  // Remove any remaining non-word chars
                .replace(/\-\-+/g, '-')    // Replace multiple hyphens with single
                .replace(/^-+/, '')        // Trim hyphens from start
                .replace(/-+$/, '');       // Trim hyphens from end
            
            heading.id = headingId;
        }
        
        // Skip adding copy buttons on the About page
        if (isAboutPage) {
            return;
        }
        
        // Create anchor link wrapper
        const wrapper = document.createElement('span');
        wrapper.className = 'heading-link-wrapper';
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'heading-copy-button';
        copyButton.title = 'Copy link to this section';
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        
        // Add copy functionality
        copyButton.addEventListener('click', function(e) {
            e.preventDefault();
            const url = new URL(window.location.href);
            // Remove any existing hash
            url.hash = '';
            // Add the heading id as hash
            const fullUrl = url.toString() + `#${heading.id}`;
            
            navigator.clipboard.writeText(fullUrl).then(function() {
                copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy URL: ', err);
                copyButton.innerHTML = '<i class="fa-solid fa-times"></i>';
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            });
        });
        
        // Append elements to wrapper
        wrapper.appendChild(copyButton);
        
        // Add wrapper to heading
        heading.appendChild(wrapper);
        
        // Add click handler to highlight the heading when it's the target of a hash link
        if (window.location.hash === `#${heading.id}`) {
            heading.classList.add('anchor-highlight');
        }
        
        // Update highlight on hash change
        window.addEventListener('hashchange', function() {
            if (window.location.hash === `#${heading.id}`) {
                heading.classList.add('anchor-highlight');
            } else {
                heading.classList.remove('anchor-highlight');
            }
        });
    });
}

/**
 * Highlight active TOC link on scroll
 */
function highlightTocOnScroll() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6');
    
    if (tocLinks.length === 0 || headings.length === 0) {
        return;
    }
    
    // Add click handler for TOC links
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the target heading id
            const targetId = link.getAttribute('href').substring(1);
            const targetHeading = document.getElementById(targetId);
            
            if (targetHeading) {
                // Calculate position with offset for fixed header
                const headerHeight = document.querySelector('.banner')?.offsetHeight || 80;
                const targetPosition = targetHeading.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Highlight the heading temporarily
                targetHeading.classList.add('anchor-highlight');
                setTimeout(() => {
                    targetHeading.classList.remove('anchor-highlight');
                }, 2000);
                
                // Remove active class from all TOC links and add to clicked one
                tocLinks.forEach(tl => tl.classList.remove('active'));
                link.classList.add('active');
                
                // Also highlight parent links
                let parent = link.closest('.toc-item');
                if (parent) {
                    // Go up the hierarchy to highlight parent items
                    while (parent && parent.parentElement) {
                        const parentLink = parent.querySelector(':scope > .toc-link');
                        if (parentLink) {
                            parentLink.classList.add('active');
                        }
                        
                        // Move to parent's parent
                        if (parent.parentElement.classList.contains('toc-content')) {
                            break;
                        }
                        parent = parent.parentElement.closest('.toc-item');
                    }
                }
            }
        });
    });
    
    // Create IntersectionObserver
    const headerHeight = document.querySelector('.banner')?.offsetHeight || 80;
    
    const options = {
        rootMargin: `-${headerHeight + 20}px 0px -80% 0px`,
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove all active classes
                tocLinks.forEach(link => link.classList.remove('active'));
                
                // Find the matching link and add active class
                const id = entry.target.getAttribute('id');
                const correspondingLink = document.querySelector(`.toc-link[href="#${id}"]`);
                
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                    
                    // Also highlight parent links
                    let parent = correspondingLink.closest('.toc-item');
                    if (parent) {
                        // Go up the hierarchy to highlight parent items
                        while (parent && parent.parentElement) {
                            const parentLink = parent.querySelector(':scope > .toc-link');
                            if (parentLink) {
                                parentLink.classList.add('active');
                            }
                            
                            // Move to parent's parent
                            if (parent.parentElement.classList.contains('toc-content')) {
                                break;
                            }
                            parent = parent.parentElement.closest('.toc-item');
                        }
                    }
                }
            }
        });
    }, options);
    
    // Observe all headings
    headings.forEach(heading => {
        observer.observe(heading);
    });
    
    // Also trigger on scroll for browsers that don't support IntersectionObserver well
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Determine scroll direction
        const scrollDown = scrollTop > lastScrollTop;
        lastScrollTop = scrollTop;
        
        // Don't process every scroll event
        if (window.scrollHandlerTimeout) {
            clearTimeout(window.scrollHandlerTimeout);
        }
        
        window.scrollHandlerTimeout = setTimeout(() => {
            // Find the heading that's currently in view
            let currentHeading = null;
            const offset = headerHeight + 40;
            
            if (scrollDown) {
                // When scrolling down, select headings that are at or above the top
                for (let i = 0; i < headings.length; i++) {
                    const rect = headings[i].getBoundingClientRect();
                    if (rect.top <= offset) {
                        currentHeading = headings[i];
                    } else {
                        break;
                    }
                }
            } else {
                // When scrolling up, we want the first heading that's below the fold
                for (let i = headings.length - 1; i >= 0; i--) {
                    const rect = headings[i].getBoundingClientRect();
                    if (rect.top <= offset) {
                        currentHeading = headings[i];
                        break;
                    }
                }
            }
            
            if (currentHeading) {
                const id = currentHeading.getAttribute('id');
                
                // Remove active class from all TOC links
                tocLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to corresponding TOC link
                const correspondingLink = document.querySelector(`.toc-link[href="#${id}"]`);
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                    
                    // Also highlight parent links
                    let parent = correspondingLink.closest('.toc-item');
                    if (parent) {
                        // Go up the hierarchy to highlight parent items
                        while (parent && parent.parentElement) {
                            const parentLink = parent.querySelector(':scope > .toc-link');
                            if (parentLink) {
                                parentLink.classList.add('active');
                            }
                            
                            // Move to parent's parent
                            if (parent.parentElement.classList.contains('toc-content')) {
                                break;
                            }
                            parent = parent.parentElement.closest('.toc-item');
                        }
                    }
                }
            }
        }, 100);
    });
}

/**
 * Handle TOC toggle (collapsible)
 */
function setupTocCollapse() {
    const tocContainer = document.querySelector('.toc-sticky');
    const tocToggle = document.querySelector('.toc-toggle');
    
    if (!tocContainer || !tocToggle) return;
    
    // Check if there's a stored preference for TOC state
    const preferCollapsed = window.innerWidth <= 768;
    const isCollapsed = localStorage.getItem('tocCollapsed') === 'true' || preferCollapsed;

    // Set initial state
    if (isCollapsed) {
        tocContainer.classList.add('toc-collapsed');
    }
    
    // Add progress bar for scroll indication
    const progressContainer = document.createElement('div');
    progressContainer.className = 'toc-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'toc-progress-bar';
    progressContainer.appendChild(progressBar);
    tocContainer.appendChild(progressContainer);
    
    // Handle toggle click
    tocToggle.addEventListener('click', () => {
        tocContainer.classList.toggle('toc-collapsed');
        const isNowCollapsed = tocContainer.classList.contains('toc-collapsed');
        localStorage.setItem('tocCollapsed', isNowCollapsed);
        
        // If expanding, scroll to active link after a short delay
        if (!isNowCollapsed) {
            setTimeout(() => {
                const activeLink = tocContainer.querySelector('.toc-link.active');
                if (activeLink) {
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    });
    
    // Allow clicking anywhere on collapsed TOC to expand it
    tocContainer.addEventListener('click', (e) => {
        if (tocContainer.classList.contains('toc-collapsed') && e.target !== tocToggle && !tocToggle.contains(e.target)) {
            tocContainer.classList.remove('toc-collapsed');
            localStorage.setItem('tocCollapsed', 'false');
            
            // Same logic to scroll to active link after expanding
            setTimeout(() => {
                const activeLink = tocContainer.querySelector('.toc-link.active');
                if (activeLink) {
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    });
    
    // Auto-scroll to active section in TOC
    function scrollToActiveLink() {
        if (!tocContainer.classList.contains('toc-collapsed')) {
            const activeLink = tocContainer.querySelector('.toc-link.active');
            if (activeLink) {
                // Get TOC content container and its height
                const tocContent = tocContainer.querySelector('.toc-content');
                const tocHeight = tocContent.clientHeight;
                
                // Get active link position relative to TOC content
                const linkTop = activeLink.offsetTop;
                const linkHeight = activeLink.clientHeight;
                
                // Calculate if link is outside viewable area
                const currentScroll = tocContent.scrollTop;
                const linkTopRelative = linkTop - currentScroll;
                
                // If link is out of view, scroll to it
                if (linkTopRelative < 0 || linkTopRelative > tocHeight - linkHeight) {
                    tocContent.scrollTo({
                        top: linkTop - (tocHeight / 2),
                        behavior: 'smooth'
                    });
                }
            }
        }
    }
    
    // Update progress bar on scroll
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        // Calculate scroll percentage
        const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
        progressBar.style.height = `${scrollPercent}%`;
        
        // Scroll to active section in TOC after a short delay
        if (window.tocScrollTimeout) {
            clearTimeout(window.tocScrollTimeout);
        }
        
        window.tocScrollTimeout = setTimeout(() => {
            scrollToActiveLink();
        }, 200);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // If on mobile/small screens and no explicit user preference, collapse it
        if (window.innerWidth <= 768 && localStorage.getItem('tocCollapsed') === null) {
            tocContainer.classList.add('toc-collapsed');
        }
        // If on desktop and no explicit preference, expand it
        else if (window.innerWidth > 768 && localStorage.getItem('tocCollapsed') === null) {
            tocContainer.classList.remove('toc-collapsed');
        }
    });
}

/**
 * Setup mobile menu toggle
 */
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    
    if (!menuToggle || !menu) return;
    
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !menuToggle.contains(e.target) && menu.classList.contains('active')) {
            menu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
}

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Update toggle icon based on theme
    const toggleIcon = document.querySelector('.theme-toggle i');
    if (toggleIcon) {
        toggleIcon.className = savedTheme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
    }

    // Handle theme toggle click
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Update theme toggle icon
            const themeIcon = themeToggle.querySelector('i');
            if (themeIcon) {
                themeIcon.className = newTheme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
            }
        });
    }
    
    // Banner shrink on scroll
    const banner = document.querySelector('.banner');
    
    if (banner) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 20) {
                banner.classList.add('scrolled');
            } else {
                banner.classList.remove('scrolled');
            }
        });
        
        // Simulate a scroll event initially to set the correct state
        setTimeout(() => {
            window.dispatchEvent(new Event('scroll'));
        }, 100);
    }
}

/**
 * Setup smooth scrolling for anchor links
 */
function smoothScrollToAnchor() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty anchors
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Get height of fixed header for offset
                const headerHeight = document.querySelector('.banner')?.offsetHeight || 80;
                
                // Calculate position with offset
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Highlight target temporarily
                targetElement.classList.add('anchor-highlight');
                setTimeout(() => {
                    targetElement.classList.remove('anchor-highlight');
                }, 2000);
            }
        });
    });
}

/**
 * Setup copy buttons for code blocks
 */
function setupCopyButtons() {
    document.querySelectorAll('.copy-button').forEach(button => {
        // Check if event listener is already attached
        if (button.hasAttribute('data-listener-attached')) return;
        
        button.setAttribute('data-listener-attached', 'true');
        
        button.addEventListener('click', function() {
            const codeBlock = this.closest('figure.highlight, .code-block-wrapper');
            if (!codeBlock) return;
            
            let code;
            if (codeBlock.classList.contains('code-block-wrapper')) {
                code = codeBlock.querySelector('pre').textContent;
            } else {
                code = Array.from(codeBlock.querySelectorAll('.line'))
                    .map(line => line.textContent)
                    .join('\n');
            }
            
            navigator.clipboard.writeText(code).then(() => {
                this.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => {
                    this.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code:', err);
                this.innerHTML = '<i class="fa-solid fa-times"></i>';
                setTimeout(() => {
                    this.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            });
        });
    });
}

/**
 * Setup back to top button
 */
function setupBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;
    
    // Hide initially if at the top of the page
    if (window.scrollY <= 100) {
        backToTop.classList.add('hidden');
    }
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            backToTop.classList.remove('hidden');
        } else {
            backToTop.classList.add('hidden');
        }
    });
    
    // Scroll to top when clicked
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}