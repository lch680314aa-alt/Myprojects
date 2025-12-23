// --- [수정] 데이터 로드 및 초기화 ---
let usageCount = parseInt(localStorage.getItem('daon_usage') || '0'); // 숫자로 확실히 변환
let isPremium = localStorage.getItem('daon_premium') === 'true';
let currentVid = "XzE-Xw5Z8Fk"; 
let player;

// 유튜브 API 초기 설정 (처음엔 무음으로 시작할 수 있음)
window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
        height: '100%', width: '100%', videoId: currentVid,
        playerVars: { 
            'autoplay': 1, 
            'controls': 0, 
            'mute': 1, // 브라우저 정책상 처음엔 뮤트(1)로 시작하는 것이 안전합니다.
            'loop': 1, 
            'playlist': currentVid,
            'playsinline': 1 // 모바일에서 전체화면 방지
        },
        events: { 
            'onReady': (e) => {
                e.target.playVideo();
                // PC의 경우 준비되자마자 음소거 해제 시도
                if(!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                    e.target.unMute();
                    e.target.setVolume(100);
                }
            }
        }
    });
};

// --- [수정] 3단계 발사 및 사운드 잠금 해제 ---
window.executeLaunch = (withSound) => {
    document.getElementById('choice-modal').style.display = 'none';
    const msg = document.getElementById('user-input').value;
    const nick = document.getElementById('user-nickname').value || "다온프렌즈";
    const btn = document.getElementById('action-btn');
    const expSound = document.getElementById('explosion-sound'); // 함수 안에서 다시 잡기

    // [핵심] 사용자가 버튼을 누른 이 순간, 모든 소리 잠금을 해제합니다.
    if (withSound && player && typeof player.unMute === 'function') {
        player.unMute();     // 음소거 강제 해제
        player.setVolume(100); // 볼륨 최대
        player.playVideo();   // 혹시 멈춰있다면 재생
    }

    // 버튼 SEND로 변경
    btn.innerText = "SEND";
    btn.style.background = "#ff4757";
    btn.style.animation = "pulse 1.2s infinite";
    btn.onclick = window.shootAndShare;

    // 3회 연속 발사
    let count = 0;
    const loop = () => {
        if(count < 3) {
            // 폭죽 소리 재생 (에러 방지 처리)
            if(withSound && expSound) { 
                expSound.muted = false; // 혹시 뮤트되어 있다면 해제
                expSound.currentTime = 0; 
                expSound.play().catch(e => console.log("소리 재생 권한 대기 중...")); 
            }
            rockets.push(new Rocket(msg));
            count++;
            setTimeout(loop, 2500);
        }
    };
    loop();

    if(isPremium) showSeal(nick);
};
// --- [3] 전송 및 미션/보관함 로직 ---
window.shootAndShare = () => {
    usageCount++;
    localStorage.setItem('daon_usage', usageCount);

    if(usageCount >= 3 && !isPremium) {
        document.getElementById('mission-modal').style.display = 'block';
        return;
    }

    const msg = document.getElementById('user-input').value;
    const nick = document.getElementById('user-nickname').value || "다온프렌즈";
    const url = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(msg)}&nick=${encodeURIComponent(nick)}&vid=${currentVid}&t=${Math.floor(player.getCurrentTime())}`;

    // 보관함 저장
    let vault = JSON.parse(localStorage.getItem('daon_vault') || '[]');
    vault.unshift({ msg, nick, vidId: currentVid });
    localStorage.setItem('daon_vault', JSON.stringify(vault.slice(0,10)));

    if(navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        navigator.share({ title: `🎆 ${nick}님의 불꽃`, text: msg, url: url });
    } else {
        const qrDiv = document.getElementById('qr-code-img');
        qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}" style="border:5px solid white;">`;
        document.getElementById('qr-modal').style.display = 'block';
    }
};

window.goYouTubeMission = () => {
    window.open("https://youtube.com/@da-onofficial?sub_confirmation=1");
    isPremium = true;
    localStorage.setItem('daon_premium', 'true');
    document.getElementById('mission-modal').style.display = 'none';
    alert("미션 완료! 황금 인장이 활성화되었습니다! ✨");
};

// 인장 표시
function showSeal(name) {
    const seal = document.getElementById('golden-seal');
    document.getElementById('seal-text').innerText = `Created by ${name} with DA-ON OFFICIAL`;
    seal.style.display = 'block';
}

// 보관함 기능
window.openVault = () => {
    const vault = JSON.parse(localStorage.getItem('daon_vault') || '[]');
    const list = document.getElementById('vault-list');
    list.innerHTML = vault.map(v => `<div style="padding:8px; border-bottom:1px solid #eee;"><strong>${v.msg}</strong> (by ${v.nick})</div>`).join('');
    document.getElementById('vault-modal').style.display = 'block';
};
window.closeVault = () => document.getElementById('vault-modal').style.display = 'none';

// --- [4] 불꽃 엔진 및 로드 로직 (기본 유지) ---
class Particle {
    constructor(x, y, color, velocity, isText=false, text="") {
        this.x=x; this.y=y; this.color=color; this.velocity=velocity; this.isText=isText; this.text=text;
        this.alpha=1; this.friction=isText?0.98:0.95; this.gravity=isText?0.05:0.2; this.fade=isText?0.005:0.02;
    }
    draw() {
        ctx.save(); ctx.globalAlpha=this.alpha;
        if(this.isText){ ctx.font='bold 40px Arial'; ctx.textAlign='center'; ctx.fillStyle=this.color; ctx.fillText(this.text, this.x, this.y); }
        else { ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2); ctx.fillStyle=this.color; ctx.fill(); }
        ctx.restore();
    }
    update() { this.velocity.x*=this.friction; this.velocity.y*=this.friction; this.velocity.y+=this.gravity; this.x+=this.velocity.x; this.y+=this.velocity.y; this.alpha-=this.fade; }
}
let particles = []; let rockets = [];
class Rocket {
    constructor(msg=null) {
        this.msg=msg; this.color=`hsl(${Math.random()*360},100%,60%)`; this.x=msg?canvas.width/2:Math.random()*canvas.width;
        this.y=canvas.height; this.targetY=msg?canvas.height*0.25:Math.random()*canvas.height*0.5; this.velocity={x:msg?0:(Math.random()-0.5)*4, y:msg?-15:-Math.random()*10-5};
    }
    update() { this.x+=this.velocity.x; this.y+=this.velocity.y; if(this.y<=this.targetY){ this.explode(); return false; } return true; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI*2); ctx.fillStyle=this.color; ctx.fill(); }
    explode() {
        if(this.msg) particles.push(new Particle(this.x, this.y, '#fff', {x:0,y:0}, true, this.msg));
        for(let i=0; i<40; i++) { const a=Math.random()*Math.PI*2; const s=Math.random()*8; particles.push(new Particle(this.x, this.y, this.color, {x:Math.cos(a)*s, y:Math.sin(a)*s})); }
    }
}
function animate() {
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(Math.random()<0.03) rockets.push(new Rocket());
    rockets=rockets.filter(r=>r.update()); rockets.forEach(r=>r.draw());
    particles=particles.filter(p=>p.alpha>0); particles.forEach(p=>{p.update(); p.draw();});
    requestAnimationFrame(animate);
}
window.onload = () => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get('msg'); const n = p.get('nick');
    if(m) { setTimeout(() => { rockets.push(new Rocket(m)); if(n) showSeal(n); }, 1500); }
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    animate();
};