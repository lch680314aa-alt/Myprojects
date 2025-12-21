// 1. 카카오톡 인앱 브라우저 탈출 및 외부 브라우저(크롬 등) 실행 로직
(function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('kakaotalk') > -1) {
        // 안드로이드: 크롬으로 강제 실행
        if (ua.indexOf('android') > -1) {
            location.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
        } 
        // iOS(아이폰): 사파리에서 열기 유도 (iOS는 강제 실행이 제한적이라 별도 안내가 뜰 수 있습니다)
        else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('ipod') > -1) {
            // iOS는 특정 브라우저 강제가 어려워, 안내창을 띄우거나 아래 공유 기능을 보완합니다.
        }
    }
})();

const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

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
            ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
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
            this.x = canvas.width / 2; this.targetY = canvas.height * 0.15; this.velocity = { x: 0, y: -16 };
        } else { 
            this.x = Math.random() * canvas.width; this.targetY = Math.random() * (canvas.height / 2);
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

// --- 사용자 소통 기능 ---

window.showPhoneModal = function() {
    const msg = document.getElementById('user-input').value;
    if (!msg.trim()) { alert("메시지를 먼저 입력해주세요!"); return; }
    document.getElementById('phone-modal').style.display = 'block';
};

window.executeFinalSend = function() {
    const msgInput = document.getElementById('user-input');
    const phoneInput = document.getElementById('phone-input');
    const message = msgInput.value;
    const phone = phoneInput.value;

    if (!phone.trim()) { alert("상대방 정보를 입력해주세요!"); return; }

    rockets.push(new Rocket(message));
    document.getElementById('phone-modal').style.display = 'none';

    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;

    if (navigator.share) {
        navigator.share({
            title: '🎆 다온님을 위한 불꽃 메시지',
            text: `[보낸이: ${phone}]\n내용: ${message}`,
            url: shareUrl,
        })
        .then(() => { msgInput.value = ""; phoneInput.value = ""; })
        .catch((err) => { copyToClipboard(shareUrl, msgInput, phoneInput); });
    } else {
        copyToClipboard(shareUrl, msgInput, phoneInput);
    }
};

function copyToClipboard(url, msgInput, phoneInput) {
    navigator.clipboard.writeText(url).then(() => {
        alert("링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.");
        msgInput.value = ""; phoneInput.value = "";
    });
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500);
    }
    animate();
};