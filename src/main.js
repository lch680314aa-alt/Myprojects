const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor(x, y, color, velocityX, velocityY) {
        this.x = x; this.y = y; this.color = color;
        this.velocityX = velocityX; this.velocityY = velocityY;
        this.alpha = 1; this.friction = 0.95; this.gravity = 0.2;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
    }
    update() {
        this.velocityX *= this.friction; this.velocityY *= this.friction;
        this.velocityY += this.gravity; this.x += this.velocityX; this.y += this.velocityY;
        this.alpha -= 0.01;
    }
}

let particles = [];
function createFirework(x, y) {
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    for (let i = 0; i < 100; i++) {
        const velocity = Math.random() * 8 + 2; const angle = Math.random() * Math.PI * 2;
        particles.push(new Particle(x, y, color, Math.cos(angle) * velocity, Math.sin(angle) * velocity));
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => { if (p.alpha > 0) { p.update(); p.draw(); } else { particles.splice(i, 1); }});
    if (Math.random() < 0.05) createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.5);
    requestAnimationFrame(animate);
}
animate();