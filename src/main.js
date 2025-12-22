// 1. [유지] 카카오톡 인앱 브라우저 탈출 로직
(function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('kakaotalk') > -1 && ua.indexOf('android') > -1) {
        location.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
    }
})();

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

// --- 불꽃 물리 엔진 (기존 유지) ---
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
            ctx.font = 'bold 45px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = this.color;
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

// --- [수정] SEND 클릭 시 즉시 카톡/문자 공유창 호출 ---
window.shootAndShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) return;

    // 1. 링크 생성 및 자동 복사 (안전장치)
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(shareUrl);

    // 2. [요청 반영] 불필요한 알림창 및 우측 패널 표시 로직 제거
    // 3. 시스템 공유창 호출
    if (navigator.share) {
        navigator.share({
            title: '🎆 다온님을 위한 불꽃 메시지',
            text: message,
            url: shareUrl,
        })
        .then(() => { input.value = ""; })
        .catch(() => { /* 취소 시 조용히 종료 */ });
window.shootAndShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) return;

    // 1. 링크 생성 및 자동 복사
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(shareUrl);

    // 2. [핵심 수정] 기기 체크를 더 엄격하게 합니다.
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // 3. 순서를 바꿉니다: 모바일이고 공유기능이 있을 때만 시스템 창 호출
    if (isMobile && navigator.share) {
        navigator.share({
            title: '🎆 다온님을 위한 불꽃 메시지',
            text: message,
            url: shareUrl,
        }).then(() => { input.value = ""; }).catch(() => {});
    } 
    // 모바일이 아니거나(PC), 공유 기능이 없는 경우 무조건 여기로 옵니다.
    else {
        const qrModal = document.getElementById('qr-modal');
        const qrImgContainer = document.getElementById('qr-code-img');
        
        if (qrModal && qrImgContainer) {
            // QR 코드 생성 API 호출
            qrImgContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}" alt="QR" style="border:5px solid white; display:block; margin:0 auto;">`;
            qrModal.style.display = 'block'; // 팝업창 열기
        } else {
            // 만약 HTML에 qr-modal이 없으면 알림으로 대체
            alert("링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.");
        }
    }

    // [유지] 내 화면 폭죽 발사
    rockets.push(new Rocket(message));
    input.value = "";
};
// [유지] 상대방이 링크를 열었을 때 로직
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500); // 1.5초 뒤 자동 발사
        setTimeout(() => {
            const input = document.getElementById('user-input');
            input.placeholder = "답장을 적어서 다시 보내보세요!";
            input.focus();
        }, 4000); // 4초 뒤 답장 유도
    }
    animate();
};