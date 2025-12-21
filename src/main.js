const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 음악 제어
musicBtn.onclick = () => {
    if (bgm.paused) { bgm.play(); musicBtn.innerText = '⏸️'; }
    else { bgm.pause(); musicBtn.innerText = '🎵'; }
};

class Particle {
    constructor(x, y, color, velocity, message = null) {
        this.x = x; this.y = y; this.color = color; this.velocity = velocity;
        this.alpha = 1; this.friction = 0.95; this.gravity = 0.15; this.message = message;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.message) {
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.fillText(this.message, this.x, this.y);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }
    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

let particles = [];

function createFirework(x, y, message) {
    const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
    // 글자 폭죽 생성
    particles.push(new Particle(x, y, color, {x: 0, y: 0}, message));
    // 주변 불꽃 생성
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, color, {
            x: Math.cos(i) * Math.random() * 8,
            y: Math.sin(i) * Math.random() * 8
        }));
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// 입력창에서 쏘기
window.shootFromInput = function() {
    const input = document.getElementById('user-input');
    if (!input.value) return;
    
    // 중앙 하단에서 위로 솟구치는 효과 (단순화 위해 즉시 터짐 구현)
    createFirework(canvas.width / 2, canvas.height / 3, input.value);
    
    // 공유용 주소 생성 (카톡 전송용)
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(input.value)}`;
    console.log("이 주소를 복사해서 보내세요:", shareUrl);
    input.value = '';
};

// 페이지 로드 시 URL에 메시지가 있으면 자동으로 터뜨림
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    if (msg) {
        setTimeout(() => createFirework(canvas.width / 2, canvas.height / 3, msg), 1500);
    }
    animate();
};