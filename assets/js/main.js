// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const contactCards = document.querySelectorAll('.contact-card');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            contactCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.6s ease-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let valid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.style.borderColor = '#dc3545';
                    
                    // Add error message
                    let error = field.parentNode.querySelector('.error-message');
                    if (!error) {
                        error = document.createElement('div');
                        error.className = 'error-message';
                        error.style.color = '#dc3545';
                        error.style.fontSize = '0.9rem';
                        error.style.marginTop = '4px';
                        field.parentNode.appendChild(error);
                    }
                    error.textContent = 'This field is required';
                } else {
                    field.style.borderColor = '';
                    const error = field.parentNode.querySelector('.error-message');
                    if (error) error.remove();
                }
            });
            
            if (!valid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
    
    // Category filter highlighting
    const currentPath = window.location.pathname;
    const categoryLinks = document.querySelectorAll('.category-tag');
    categoryLinks.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
    
    // WhatsApp click tracking
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', function() {
            // You can add analytics here
            console.log('WhatsApp link clicked:', this.href);
        });
    });
});