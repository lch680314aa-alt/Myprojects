const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

musicBtn.onclick = () => {
    if (bgm.paused) { bgm.play(); musicBtn.innerText = '⏸️'; }
    else { bgm.pause(); musicBtn.innerText = '🎵'; }
};

// --- 불꽃 클래스 (Particle & Rocket) ---
class Particle {
    constructor(x, y, color, velocity, isText = false, text = "") {
        this.x = x; this.y = y; this.color = color; this.velocity = velocity;
        this.isText = isText; this.text = text;
        this.alpha = 1; this.friction = isText ? 0.98 : 0.95;
        this.gravity = isText ? 0.05 : 0.2; this.fade = isText ? 0.005 : 0.02;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha;
        if (this.isText) {
            ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = this.color;
            ctx.shadowBlur = 15; ctx.shadowColor = 'white'; ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
        }
        ctx.restore();
    }
    update() {
        this.velocity.x *= this.friction; this.velocity.y *= this.friction;
        this.velocity.y += this.gravity; this.x += this.velocity.x; this.y += this.velocity.y;
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
        if (this.message) { 
            this.x = canvas.width / 2; this.targetY = canvas.height * 0.2; this.velocity = { x: 0, y: -16 };
        } else { 
            this.x = Math.random() * canvas.width; this.targetY = Math.random() * (canvas.height * 0.5);
            this.velocity = { x: (Math.random() - 0.5) * 4, y: -Math.random() * 10 - 5 };
        }
    }
    update() {
        this.x += this.velocity.x; this.y += this.velocity.y;
        if (this.y <= this.targetY) { this.explode(); return false; }
        return true;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
    }
    explode() {
        if (explosionSound) { explosionSound.currentTime = 0; explosionSound.play().catch(() => {}); }
        if (this.message) { particles.push(new Particle(this.x, this.y, '#fff', {x:0, y:0}, true, this.message)); }
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 8;
            particles.push(new Particle(this.x, this.y, this.color, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }));
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Math.random() < 0.03) { rockets.push(new Rocket()); }
    rockets = rockets.filter(r => r.update()); rockets.forEach(r => r.draw());
    particles = particles.filter(p => p.alpha > 0); particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// --- [요청 1] 안정적인 발사 및 공유 흐름 ---
window.shootAndShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) { alert("메시지를 입력해주세요!"); return; }

    // 1단계: 내 화면에서 즉시 폭죽 발사
    rockets.push(new Rocket(message));

    // 2단계: 공유 링크 생성 및 사전 복사
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(shareUrl);

    // 3단계: 기기에 맞는 공유창 호출
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        // 스마트폰 공유 메뉴 즉시 호출
        navigator.share({ title: '🎆 불꽃 메시지', text: message, url: shareUrl })
        .then(() => { input.value = ""; })
        .catch(() => { alert("링크가 복사되었습니다! 카톡에 붙여넣어 주세요."); input.value = ""; });
    } else {
        // PC: 우측 패널 표시
        document.getElementById('right-share-panel').style.display = 'flex';
        input.value = "";
    }
};

window.confirmShare = function(type) {
    alert(`${type}로 보낼 링크 복사가 완료되었습니다!\n채팅창에 붙여넣기(Ctrl+V) 하세요.`);
    document.getElementById('right-share-panel').style.display = 'none';
};

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) { setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500); }
    animate();
};