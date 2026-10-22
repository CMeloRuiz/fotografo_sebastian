// Header scroll effect
const header = document.querySelector('header');
let lastScrollPosition = 0;

window.addEventListener('scroll', () => {
    const currentScrollPosition = window.scrollY;
    
    if (currentScrollPosition > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScrollPosition = currentScrollPosition;
});

// Función para animar los números
function animateNumber(element, target) {
    let current = 0;
    const duration = 2000; // 2 segundos
    const step = target / (duration / 16); // 16ms es aproximadamente 60fps

    function update() {
        if (current < target) {
            current = Math.min(current + step, target);
            element.textContent = Math.floor(current);
            requestAnimationFrame(update);
        }
    }

    update();
}

// Observer para detectar cuando la sección está visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Animar todos los números cuando la sección sea visible
            const numbers = entry.target.querySelectorAll('.stat-number');
            numbers.forEach(number => {
                const target = parseInt(number.getAttribute('data-target'));
                animateNumber(number, target);
            });
            // Dejar de observar después de la primera animación
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 }); // Trigger cuando al menos 50% de la sección sea visible

// Observar la sección de estadísticas
document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
});


