const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 화면 크기 조절 대응
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// 음악 재생 제어
musicBtn.onclick = () => {
    if (bgm.paused) { bgm.play(); musicBtn.innerText = '⏸️'; }
    else { bgm.pause(); musicBtn.innerText = '🎵'; }
};

// --- 불꽃 조각(Particle) 클래스 ---
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

// --- 폭죽 로켓(Rocket) 클래스 ---
class Rocket {
    constructor(message = null) {
        this.message = message;
        this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        this.y = canvas.height;
        if (this.message) { // 메시지 폭죽: 하단 중앙에서 꼭대기로
            this.x = canvas.width / 2;
            this.targetY = canvas.height * 0.15;
            this.velocity = { x: 0, y: -16 };
        } else { // 배경 랜덤 폭죽: 사방팔방
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

// --- 애니메이션 루프 ---
function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 폭죽 자동 발사 (확률 조정 가능)
    if (Math.random() < 0.03) { rockets.push(new Rocket()); }

    rockets = rockets.filter(r => r.update());
    rockets.forEach(r => r.draw());
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// --- 사용자 소통 로직 ---

// 1. 발사하기 버튼 클릭 (번호 입력창 띄우기)
window.showPhoneModal = function() {
    const msg = document.getElementById('user-input').value;
    if (!msg.trim()) { alert("메시지를 먼저 입력해주세요!"); return; }
    document.getElementById('phone-modal').style.display = 'block';
};

// 2. 최종 보내기 클릭 (내 화면 발사 + 스마트폰 공유창 호출)
window.executeFinalSend = function() {
    const msgInput = document.getElementById('user-input');
    const phoneInput = document.getElementById('phone-input');
    const message = msgInput.value;
    const phone = phoneInput.value;

    if (!phone.trim()) { alert("상대방 성함이나 번호를 입력해주세요!"); return; }

    // 내 화면에서 폭죽 즉시 발사
    rockets.push(new Rocket(message));
    
    // 모달 닫기 및 입력값 초기화 준비
    document.getElementById('phone-modal').style.display = 'none';

    // 전용 공유 링크 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;

    // 공유창 호출 (모바일 카톡 연결)
    if (navigator.share) {
        navigator.share({
            title: '🎆 불꽃 메시지가 도착했습니다',
            text: `[보낸이: ${phone}]\n내용: ${message}`,
            url: shareUrl,
        }).then(() => {
            msgInput.value = ""; phoneInput.value = "";
        }).catch((err) => console.log('공유 실패:', err));
    } else {
        // PC 브라우저 등 지원 안 하는 경우 링크 복사
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("공유 링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.\n링크: " + shareUrl);
            msgInput.value = ""; phoneInput.value = "";
        });
    }
};

// 3. 페이지 로드 시 (상대방이 링크를 열었을 때)
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        // 상대방 화면에서 1.5초 뒤 폭죽 터뜨리기
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500);
        // 답장 유도
        setTimeout(() => {
            const input = document.getElementById('user-input');
            input.placeholder = "답장을 적어보세요!";
            input.focus();
        }, 4000);
    }
    animate();
};