// [1] 카카오톡 인앱 브라우저 탈출 로직
(function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('kakaotalk') > -1) {
        if (ua.indexOf('android') > -1) {
            location.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
        }
    }
})();

// [2] 카카오 SDK 초기화 (본인의 자바스크립트 키로 변경 필수)
if (!Kakao.isInitialized()) {
    Kakao.init('YOUR_JAVASCRIPT_KEY'); 
}

// [3] 카카오톡 공유 함수
function shareToKakao() {
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '다온 불꽃놀이 2025',
            description: '다온이의 새해 메시지가 도착했습니다!',
            imageUrl: 'https://daon-fireworks-2025.vercel.app/og-image.png', 
            link: {
                mobileWebUrl: window.location.href,
                webUrl: window.location.href,
            },
        },
        buttons: [
            {
                title: '메시지 확인하기',
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            },
        ],
    });
}

// [4] 황금인장 제어 로직 (3회 접속 시 보이고 5초 뒤 삭제)
function handleGoldenSeal(visitCount) {
    const sealElement = document.getElementById('golden-seal'); // 인장 ID 확인 필요
    if (visitCount >= 3 && sealElement) {
        sealElement.style.display = 'block';
        sealElement.classList.add('fade-out-animation'); //
         CSS 애니메이션 연결
        /* 황금인장 서서히 사라지는 애니메이션 */
.fade-out-animation {
    animation: fadeOut ease 5s;
    -webkit-animation: fadeOut ease 5s;
}

@keyframes fadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; } /* 3.5초까지는 보임 */
    100% { opacity: 0; } /* 마지막에 사라짐 */
}

/* 초기에는 인장을 숨김 */
#golden-seal {
    display: none;
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
}
        setTimeout(() => {
            sealElement.style.display = 'none';
        }, 5000); // 5초 후 완전히 제거
    }
}

// [5] 소리 문제 해결 (발사 버튼 클릭 시 호출되도록 설정)
function enableSound() {
    // 유튜브 플레이어 객체가 'player'라고 가정할 때
    if (window.player && window.player.unMute) {
        window.player.unMute();
        window.player.setVolume(70);
    }
}

let usageCount = parseInt(localStorage.getItem('daon_usage') || '0');
let isPremium = localStorage.getItem('daon_premium') === 'true';
let currentVid = "XzE-Xw5Z8Fk"; 
let player;

const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const explosionSound = document.getElementById('explosion-sound');

// [유튜브 설정]
window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
        height: '100%', width: '100%', videoId: currentVid,
        playerVars: { 'autoplay': 1, 'controls': 0, 'mute': 1, 'loop': 1, 'playlist': currentVid, 'playsinline': 1 },
        events: { 'onReady': (e) => e.target.playVideo() }
    });
};

// [발사 로직] - 버튼이 안눌리는 문제 해결용
window.openChoiceModal = () => {
    const input = document.getElementById('user-input');
    if(!input || !input.value.trim()) return;
    document.getElementById('choice-modal').style.display = 'block';
};

window.executeLaunch = (withSound) => {
    document.getElementById('choice-modal').style.display = 'none';
    const msg = document.getElementById('user-input').value;
    const nick = document.getElementById('user-nickname').value || "다온프렌즈";
    const btn = document.getElementById('action-btn');

    // 소리 잠금 해제 (중요!)
    if (withSound && player && typeof player.unMute === 'function') {
        player.unMute();
        player.setVolume(100);
        player.playVideo();
    }

    btn.innerText = "SEND";
    btn.style.background = "#ff4757";
    btn.style.animation = "pulse 1.2s infinite";
    btn.onclick = window.shootAndShare; 

    let count = 0;
    const loop = () => {
        if(count < 3) {
            if(withSound && explosionSound) { 
                explosionSound.muted = false;
                explosionSound.currentTime = 0; 
                explosionSound.play().catch(() => {}); 
            }
            rockets.push(new Rocket(msg));
            count++;
            setTimeout(loop, 2500);
        }
    };
    loop();
    if(isPremium) showSeal(nick);
};

window.shootAndShare = () => {
    usageCount++;
    localStorage.setItem('daon_usage', usageCount);
    if(usageCount >= 3 && !isPremium) {
        document.getElementById('mission-modal').style.display = 'block';
        return;
    }
    const msg = document.getElementById('user-input').value;
    const nick = document.getElementById('user-nickname').value || "다온프렌즈";
    const url = `${window.location.origin}${window.location.pathname}?msg=${encodeURIComponent(msg)}&nick=${encodeURIComponent(nick)}&vid=${currentVid}&t=${Math.floor(player ? player.getCurrentTime() : 0)}`;

    let vault = JSON.parse(localStorage.getItem('daon_vault') || '[]');
    vault.unshift({ msg, nick, vidId: currentVid });
    localStorage.setItem('daon_vault', JSON.stringify(vault.slice(0,10)));

    if(navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        navigator.share({ title: `🎆 ${nick}님의 선물`, text: msg, url: url });
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

function showSeal(name) {
    const seal = document.getElementById('golden-seal');
    document.getElementById('seal-text').innerText = `Created by ${name} with DA-ON OFFICIAL`;
    seal.style.display = 'block';
}

window.openVault = () => {
    const vault = JSON.parse(localStorage.getItem('daon_vault') || '[]');
    const list = document.getElementById('vault-list');
    list.innerHTML = vault.map(v => `<div style="padding:10px; border-bottom:1px solid #eee;"><strong>${v.msg}</strong> (by ${v.nick})</div>`).join('');
    document.getElementById('vault-modal').style.display = 'block';
};
window.closeVault = () => document.getElementById('vault-modal').style.display = 'none';
window.showOfficialMenu = () => window.open("https://youtube.com/@da-onofficial");

// [불꽃 엔진]
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
window.onresize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };