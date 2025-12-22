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

// --- 불꽃 입자 및 로켓 클래스 ---
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

// --- 발사 및 공유 제어 ---
window.shootAndShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) { alert("메시지를 입력해주세요!"); return; }

    // 1. 내 화면 즉시 폭죽 발사
    rockets.push(new Rocket(message));

    // 2. 링크 생성 및 클립보드 자동 복사
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(shareUrl);

    // 3. 기기 감지 및 시스템 공유창 호출
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        navigator.share({
            title: '🎆 불꽃 메시지 도착',
            text: `다온님께 전하는 메시지: ${message}`,
            url: shareUrl,
        })
        .then(() => { input.value = ""; })
        .catch(() => { handleFallback(input); });
    } else {
        // PC: 우측 패널 표시
        document.getElementById('right-share-panel').style.display = 'flex';
        input.value = "";
    }
};
// [최종 수정] 발사 + 공유창 호출 통합 함수
// [수정] 버튼의 shootAndShare()와 이름을 일치시키고 공유 기능을 넣었습니다.
// [최종 수정] 알림창(alert)을 없애고 자연스럽게 공유창과 연결합니다.
window.shootAndShare = function() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message.trim()) return;

    // 1. 공유 링크 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(message)}`;
    
    // 2. 모바일 기기 체크
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        // 모바일: 스마트폰 시스템 공유창(카톡 친구 선택) 즉시 호출
        navigator.share({
            title: '🎆 다온님을 위한 불꽃 메시지',
            text: `밤하늘의 메시지: ${message}`,
            url: shareUrl,
        })
        .then(() => { input.value = ""; })
        .catch(() => { 
            // 공유 취소 시 알림 없이 클립보드에만 조용히 복사
            navigator.clipboard.writeText(shareUrl);
        });
    } else {
        // PC 환경: 알림창 없이 우측 패널만 띄우고 링크는 배경에서 복사
        const panel = document.getElementById('right-share-panel');
        if (panel) {
            panel.style.display = 'flex';
            // 패널 안의 "복사 완료" 문구를 강조하거나 잠시 깜빡이게 할 수 있습니다.
        }
        navigator.clipboard.writeText(shareUrl);
        // [수정] 기존의 alert("링크가 복사되었습니다...") 코드를 삭제했습니다.
    }

    // 3. 내 화면에서 즉시 폭죽 발사
    rockets.push(new Rocket(message));
    input.value = "";
};
// 엔터키 입력 지원
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') shootAndShare();
});

// [유지] 상대방이 열었을 때의 자동 발사 및 답장 유도 로직
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        // 1.5초 뒤 자동 발사
        setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500);
        
        // 4초 뒤 답장 유도 안내
        setTimeout(() => {
            const input = document.getElementById('user-input');
            input.placeholder = "답장을 적어서 다시 보내보세요!";
            input.focus();
        }, 4000);
    }
    animate();
};
function handleFallback(input) {
    alert("링크가 복사되었습니다! 카톡창에 붙여넣어 주세요.");
    input.value = "";
}

window.confirmShare = function(type) {
    alert(`${type}로 전달할 수 있게 링크 복사가 완료되었습니다!\n채팅방에 붙여넣기(Ctrl+V) 하세요.`);
    document.getElementById('right-share-panel').style.display = 'none';
};

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) { setTimeout(() => { rockets.push(new Rocket(msg)); }, 1500); }
    animate();
};