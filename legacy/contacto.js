document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');

    // Manejar el envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Recoger los datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Aquí puedes agregar la lógica para enviar los datos
        // Por ahora solo mostraremos un mensaje de éxito
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        form.reset();
    });

    // Manejar el comportamiento de las etiquetas del formulario
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    
    inputs.forEach(input => {
        // Verificar si el input tiene valor al cargar la página
        if (input.value) {
            input.parentNode.classList.add('active');
        }

        // Manejar el foco y pérdida de foco
        input.addEventListener('focus', () => {
            input.parentNode.classList.add('active');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentNode.classList.remove('active');
            }
        });
    });

    // Manejar el select
    const select = document.querySelector('.form-group select');
    
    select.addEventListener('change', () => {
        if (select.value) {
            select.style.color = '#ffffff';
        } else {
            select.style.color = '#666';
        }
    });
});
