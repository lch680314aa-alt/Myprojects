const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-btn');
const explosionSound = document.getElementById('explosion-sound');

// 캔버스 크기 설정 (창 크기 변경에 대응)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 초기 실행

// 음악 재생 제어
musicBtn.onclick = () => {
    if (bgm.paused) {
        bgm.play().then(() => { musicBtn.innerText = '⏸️'; }).catch(e => console.log("재생 차단됨:", e));
    } else {
        bgm.pause();
        musicBtn.innerText = '🎵';
    }
};

// --- 파티클 (터진 후 조각들) 클래스 ---
class Particle {
    constructor(x, y, color, velocity, isText = false, text = "") {
        this.x = x; this.y = y; this.color = color; this.velocity = velocity;
        this.isText = isText; this.text = text;
        // 글자일 경우 더 오래 떠있고, 일반 파티클은 빨리 사라짐
        this.alpha = 1;
        this.friction = isText ? 0.98 : 0.95; // 글자 마찰력 감소 (더 멀리 퍼짐)
        this.gravity = isText ? 0.05 : 0.2;   // 글자 중력 감소 (더 천천히 떨어짐)
        this.fadeSpeed = isText ? 0.005 : 0.015; // 글자 천천히 사라짐
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.isText) {
            // === 글자 가독성 극대화 ===
            ctx.font = 'bold 60px "Arial Black", Gadget, sans-serif'; // 폰트 크기 증가 및 두꺼운 폰트
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 1. 검은색 테두리 그리기
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.strokeText(this.text, this.x, this.y);
            // 2. 밝은색 글자 채우기
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20; // 빛 번짐 효과 강화
            ctx.fillText(this.text, this.x, this.y);
        } else {
            // 일반 불꽃 입자
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.random() * 3 + 1, 0, Math.PI * 2); // 크기 랜덤
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }
    update() {
        this.velocity.x *= this.friction; this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.alpha -= this.fadeSpeed;
    }
}

let particles = [];
let rockets = [];

// --- 로켓 (쏘아올리는 폭죽) 클래스 ---
class Rocket {
    constructor(message = null) {
        this.message = message;
        this.color = `hsl(${Math.random() * 360}, 100%, 70%)`; // 더 밝은 색상
        this.y = canvas.height; // 항상 바닥에서 시작

        if (this.message) {
            // === [요청 2&3] 메시지 로켓: 하단 중앙 -> 최상단 직진 ===
            this.x = canvas.width / 2;
            this.targetY = canvas.height * 0.15; // 화면 상단 15% 지점에서 폭발 (글자 잘림 방지)
            this.velocity = { x: 0, y: -18 }; // 매우 빠르고 수직으로 상승
        } else {
            // === [요청 1] 배경 랜덤 폭죽: 하단 랜덤 위치 -> 랜덤 방향 포물선 ===
            this.x = Math.random() * canvas.width;
            // 발사 각도: 상방 45도 ~ 135도 사이 랜덤 (부채꼴 모양)
            const angle = (Math.random() * Math.PI / 2) + (Math.PI / 4);
            const speed = Math.random() * 10 + 10; // 랜덤 속도
            this.velocity = {
                x: Math.cos(angle) * speed,
                y: -Math.sin(angle) * speed * 1.2 // 위로 솟는 힘 보정
            };
        }
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.message) {
            // 메시지 로켓: 목표 높이에 도달하면 터짐
            if (this.y <= this.targetY) { this.explode(); return false; }
        } else {
            // 배경 로켓: 중력을 받아 포물선을 그림
            this.velocity.y += 0.25;
            // 속도가 0이 되어 떨어지기 시작하거나(정점), 화면 밖으로 나가면 터짐
            if (this.velocity.y >= 0 || this.y < -50 || this.x < 0 || this.x > canvas.width) {
                this.explode(); return false;
            }
        }
        return true;
    }

    draw() {
        // 로켓 머리
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // 로켓 꼬리 효과 (잔상)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velocity.x * 3, this.y - this.velocity.y * 3);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    explode() {
        // 소리 재생 (사용자 클릭 이후 작동)
        if (explosionSound) {
            explosionSound.currentTime = 0;
            explosionSound.play().catch(() => {});
        }

        if (this.message) {
            // === 메시지 폭발: 글자 파티클 생성 ===
            particles.push(new Particle(this.x, this.y, "#fff", {x:0, y:0}, true, this.message));
            // 메시지 주변 화려한 효과
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 15; // 넓게 퍼짐
                particles.push(new Particle(this.x, this.y, this.color, {
                    x: Math.cos(angle) * speed, y: Math.sin(angle) * speed
                }));
            }
        } else {
            // === 배경 폭발: 일반 파티클 생성 ===
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 10;
                particles.push(new Particle(this.x, this.y, this.color, {
                    x: Math.cos(angle) * speed, y: Math.sin(angle) * speed
                }));
            }
        }
    }
}

// 애니메이션 루프
function animate() {
    // 잔상 효과를 위한 반투명 배경 덮기
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === [요청 1] 랜덤 배경 폭죽 자동 발사 ===
    // 약 3% 확률로 프레임마다 로켓 생성 (빈도 조절 가능)
    if (Math.random() < 0.03) {
        rockets.push(new Rocket()); // 메시지 없이 생성하면 배경 폭죽이 됨
    }

    rockets = rockets.filter(r => r.update());
    rockets.forEach(r => r.draw());
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// 메시지 발사 함수 (버튼 클릭/엔터 시 호출)
window.shootFirework = function() {
    const input = document.getElementById('user-input');
    if (!input.value) return;
    // 메시지를 담아 로켓 생성 -> 하단 중앙에서 출발
    rockets.push(new Rocket(input.value));
    input.value = "";
};

// 엔터키 입력 지원
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if(e.key === 'Enter') shootFirework();
});

// 주소에 메시지가 있으면 자동 발사 (상대방 폰용)
window.onload = () => {
    window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    
    if (msg) {
        // 1. 받은 메시지 폭죽을 1.5초 뒤에 자동으로 터뜨림
        setTimeout(() => {
            rockets.push(new Rocket(msg));
        }, 1500);

        // 2. 폭죽이 터진 후, 상대방이 바로 답장을 쓸 수 있게 입력창으로 안내
        setTimeout(() => {
            const input = document.getElementById('user-input');
            input.placeholder = "답장을 적어서 다시 보내보세요!";
            input.focus(); // 입력창에 커서를 자동으로 깜빡이게 함
        }, 4000);
    }
    animate();
};
};// 실시간 공유 기능 함수
window.shareMessage = function() {
    const input = document.getElementById('user-input');
    const text = input.value;

    if (!text.trim()) {
        alert("다온에게 보낼 메시지를 먼저 입력해주세요!");
        return;
    }

    // 메시지가 포함된 전용 주소 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(text)}`;

    // 1. 모바일 시스템 공유 기능 사용 (카카오톡, 문자, DM 등)
    if (navigator.share) {
        navigator.share({
            title: '🎆 다온을 위한 특별한 불꽃놀이',
            text: `[메시지 확인하기]: ${text}`,
            url: shareUrl,
        }).then(() => console.log('공유 성공!'))
          .catch((error) => console.log('공유 실패:', error));
    } else {
        // 2. PC 등 공유 기능이 없는 경우 링크 복사로 대체
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("공유 링크가 복사되었습니다! 카카오톡이나 문자에 붙여넣어 전송하세요.\n\n링크: " + shareUrl);
        });
    }
};// 실시간 공유 기능 함수
window.shareMessage = function() {
    const input = document.getElementById('user-input');
    const text = input.value;

    if (!text.trim()) {
        alert("다온에게 보낼 메시지를 먼저 입력해주세요!");
        return;
    }

    // 메시지가 포함된 전용 주소 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(text)}`;

    // 1. 모바일 시스템 공유 기능 사용 (카카오톡, 문자, DM 등)
    if (navigator.share) {
        navigator.share({
            title: '🎆 다온을 위한 특별한 불꽃놀이',
            text: `[메시지 확인하기]: ${text}`,
            url: shareUrl,
        }).then(() => console.log('공유 성공!'))
          .catch((error) => console.log('공유 실패:', error));
    } else {
        // 2. PC 등 공유 기능이 없는 경우 링크 복사로 대체
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("공유 링크가 복사되었습니다! 카카오톡이나 문자에 붙여넣어 전송하세요.\n\n링크: " + shareUrl);
        });
    }
};