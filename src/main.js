const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

// 프레임 크기에 맞춰 캔버스 해상도 조절
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
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
            ctx.font = 'bold 35px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = this.color;
            ctx.shadowBlur = 10; ctx.shadowColor = 'white'; ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
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
            // [동기화] 프레임 가로 중앙에서 발사
            this.x = canvas.width / 2; this.targetY = canvas.height * 0.2; this.velocity = { x: 0, y: -14 };
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
        ctx.beginPath(); ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
    }
    explode() {
        if (explosionSound) { explosionSound.currentTime = 0; explosionSound.play().catch(() => {}); }
        if (this.message) { particles.push(new Particle(this.x, this.y, '#fff', {x:0, y:0}, true, this.message)); }
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 7;
            particles.push(new Particle(this.x, this.y, this.color, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }));
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Math.random() < 0.03) { rockets.push(new Rocket()); }
    rockets = rockets.filter(r => r.update()); rockets.forEach(r => r.draw());
    particles = particles.filter(p => p.alpha > 0); particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// --- [핵심] 발사 및 공유 동시 실행 ---
window.shootAndOpenShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) { alert("메시지를 입력해주세요!"); return; }

    // 1. 프레임 중앙에서 즉시 발사
    rockets.push(new Rocket(message));

    // 2. 공유 링크 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;

    // 3. 공유창 띄우기 (PC 윈도우 공유창/모바일 공유창 동일 호출)
    if (navigator.share) {
        navigator.share({
            title: '🎆 다온님을 위한 불꽃 메시지',
            text: `밤하늘에 수놓아진 메시지: ${message}`,
            url: shareUrl,
        }).then(() => { input.value = ""; })
          .catch((err) => { 
              // 공유 취소 시 링크 복사로 대체
              navigator.clipboard.writeText(shareUrl).then(() => {
                  alert("링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.");
                  input.value = "";
              });
          });
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.");
            input.value = "";
        });
    }
};

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500);
    }
    animate();
};