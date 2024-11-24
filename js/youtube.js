document.addEventListener('DOMContentLoaded', () => {
    initializeHeliLights();
    initializeBackButton();
    addScrollAnimation();
    initializeParticles();
});

function initializeHeliLights() {
    const container = document.querySelector('.container');
    const light = document.createElement('div');
    light.className = 'heli-light';
    container.appendChild(light);

    let position = 0;
    let direction = 1;

    function updateLight() {
        position += direction * 2;
        
        if (position > window.innerWidth - 100) {
            direction = -1;
        } else if (position < 0) {
            direction = 1;
        }

        light.style.left = `${position}px`;
        
        const centerY = window.innerHeight / 2;
        const y = centerY + Math.sin(position / 50) * 30;
        light.style.top = `${y}px`;

        requestAnimationFrame(updateLight);
    }

    updateLight();
}

function initializeBackButton() {
    const backButton = document.querySelector('.back-button');
    if (!backButton) return;

    backButton.addEventListener('mouseenter', () => {
        backButton.style.transform = 'scale(1.1) translateY(-2px)';
    });

    backButton.addEventListener('mouseleave', () => {
        backButton.style.transform = 'scale(1) translateY(0)';
    });

    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        backButton.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 200);
    });
}

function addScrollAnimation() {
    const items = document.querySelectorAll('li');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(item);
    });
}

let particles = [];
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function initializeParticles() {
    canvas.className = 'particle-canvas';
    document.body.appendChild(canvas);
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.5 + Math.random() * 1,
            size: 1 + Math.random() * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        particles.forEach(particle => {
            particle.y -= particle.speed;
            if (particle.y < 0) {
                particle.y = canvas.height;
                particle.x = Math.random() * canvas.width;
            }
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}