const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 음악 및 소리 설정
musicBtn.onclick = () => {
    if (bgm.paused) { bgm.play(); musicBtn.innerText = '⏸️'; }
    else { bgm.pause(); musicBtn.innerText = '🎵'; }
};

class Particle {
    constructor(x, y, color, velocity, isText = false, text = "") {
        this.x = x; this.y = y; this.color = color; this.velocity = velocity;
        this.isText = isText; this.text = text;
        this.alpha = 1;
        this.friction = isText ? 0.98 : 0.95;
        this.gravity = isText ? 0.05 : 0.2;
        this.fade = isText ? 0.005 : 0.02;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.isText) {
            ctx.font = 'bold 50px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15; ctx.shadowColor = 'white';
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
        }
        ctx.restore();
    }
    update() {
        this.velocity.x *= this.friction; this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.alpha -= this.fade;
    }
}

let particles = [];
let rockets = [];

class Rocket {
    constructor(message = null) {
        this.message = message;
        this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        this.y = canvas.height;
        if (this.message) { // 메시지 폭죽: 하단 중앙에서 꼭대기로
            this.x = canvas.width / 2;
            this.targetY = canvas.height * 0.15;
            this.velocity = { x: 0, y: -15 };
        } else { // 랜덤 배경 폭죽: 사방팔방
            this.x = Math.random() * canvas.width;
            this.targetY = Math.random() * (canvas.height / 2);
            this.velocity = { x: (Math.random() - 0.5) * 4, y: -Math.random() * 10 - 5 };
        }
    }
    update() {
        this.x += this.velocity.x; this.y += this.velocity.y;
        if (this.y <= this.targetY) { this.explode(); return false; }
        return true;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
    }
    explode() {
        if (explosionSound) { explosionSound.currentTime = 0; explosionSound.play().catch(() => {}); }
        if (this.message) {
            particles.push(new Particle(this.x, this.y, '#fff', {x:0, y:0}, true, this.message));
        }
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8;
            particles.push(new Particle(this.x, this.y, this.color, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }));
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 사방팔방 배경 폭죽 자동 발사 로직 (다시 추가)
    if (Math.random() < 0.03) { rockets.push(new Rocket()); }

    rockets = rockets.filter(r => r.update());
    rockets.forEach(r => r.draw());
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// 버튼 클릭 시 실행되는 함수
window.shootFirework = function() {
    const input = document.getElementById('user-input');
    if (!input.value.trim()) return;
    rockets.push(new Rocket(input.value));
    input.value = "";
};

// 공유 기능
window.shareMessage = function() {
    const input = document.getElementById('user-input');
    if (!input.value.trim()) { alert("메시지를 입력해주세요!"); return; }
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(input.value)}`;
    navigator.clipboard.writeText(shareUrl).then(() => { alert("공유 링크가 복사되었습니다!"); });
};

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500);
        setTimeout(() => { 
            const input = document.getElementById('user-input');
            input.placeholder = "답장을 적어보세요!";
            input.focus();
        }, 4000);
    }
    animate();
};