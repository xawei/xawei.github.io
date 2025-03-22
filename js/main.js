// Main Script for XATheme

document.addEventListener('DOMContentLoaded', function() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update toggle icon based on theme
    const toggleIcon = document.querySelector('.theme-toggle i');
    if (toggleIcon) {
        toggleIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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
                themeIcon.className = newTheme === 'light' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
            }
        });
    }
    
    // Banner shrink on scroll
    const banner = document.querySelector('.banner');
    
    // Simulate a scroll event initially to set the correct spacing
    setTimeout(function() {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
    }, 100);
    
    if (banner) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 20) {
                banner.classList.add('scrolled');
            } else {
                banner.classList.remove('scrolled');
            }
        });
    }
    
    // Back to Top button
    const backToTop = document.querySelector('.back-to-top');
    
    if (backToTop) {
        console.log('Back to top button found');
        
        // Hide initially if at the top of the page
        if (window.scrollY <= 100) {
            backToTop.classList.add('hidden');
        } else {
            backToTop.classList.remove('hidden');
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
            console.log('Back to top button clicked');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            return false;
        });
    } else {
        console.error('Back to top button not found in DOM');
    }
    
    // Code blocks handling
    processCodeBlocks();
    
    // Header shrinking/expanding on scroll
    const container = document.querySelector('.container');
    let lastScrollTop = 0;

    if (banner) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                banner.classList.add('scrolled');
            } else {
                banner.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Highlight active TOC items on scroll
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4');
    
    if (tocLinks.length > 0 && headings.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    current = heading.id;
                }
            });
            
            tocLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href && href.includes(current) && current !== '') {
                    link.classList.add('active');
                }
            });
        });
    }

    // Fix anchor jumps with smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty anchors
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Get height of fixed header for offset
                const headerHeight = document.querySelector('.banner').offsetHeight || 80;
                
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

    // Process heading links and add URL copy functionality
    processHeadingLinks();
    
    // Active TOC link highlighting on scroll
    highlightTocOnScroll();
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
            } else {
                figure.classList.add('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
            }
        });
        
        // Fold long code blocks by default
        const lineCount = figure.querySelectorAll('.line').length;
        if (lineCount > 15) {
            figure.classList.add('folded');
            foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            foldButton.title = 'Unfold Code';
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
            } else {
                wrapper.classList.add('folded');
                foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
                foldButton.title = 'Unfold Code';
            }
        });
        
        // Fold long code blocks by default
        const lineCount = (pre.textContent.match(/\n/g) || []).length + 1;
        if (lineCount > 15) {
            wrapper.classList.add('folded');
            foldButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            foldButton.title = 'Unfold Code';
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
            const headingId = headingText
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            
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
                            const parentLink = parent.querySelector('.toc-link');
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
                            const parentLink = parent.querySelector('.toc-link');
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