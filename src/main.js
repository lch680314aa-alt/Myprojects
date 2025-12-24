const KAKAO_KEY = 'fa462b2b643a16d837c1890cc3dc4149';
if (!Kakao.isInitialized()) Kakao.init(KAKAO_KEY);

const THRESHOLDS = { FIRE: 15, BLACK: 50, ULTIMATE: 100 };
let shareCount = parseInt(localStorage.getItem('daon_share_count') || '0');

function initIdentity() {
    let sn = localStorage.getItem('daon_sn');
    if (!sn) {
        sn = `DAON-2025-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        localStorage.setItem('daon_sn', sn);
    }
    document.getElementById('serial-number').innerText = sn;
}

window.handleMainAction = () => {
    const btn = document.getElementById('main-action-btn');
    if (btn.classList.contains('send-mode')) {
        shareToKakao();
    } else {
        document.getElementById('choice-modal').classList.remove('hidden');
    }
};

window.executeLaunch = (withSound) => {
    document.getElementById('choice-modal').classList.add('hidden');
    const btn = document.getElementById('main-action-btn');
    btn.innerText = "SEND TO KAKAO";
    btn.classList.add('send-mode');
    alert("불꽃이 준비되었습니다! 카카오톡으로 공유하여 등급을 올리세요.");
};

window.shareToKakao = () => {
    const last = localStorage.getItem('daon_last_action') || 0;
    const now = Date.now();
    if (now - last < 60000) {
        alert(`🚨 쿨타임: ${Math.ceil((60000-(now-last))/1000)}초 후 가능합니다.`);
        return;
    }

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `🎆 DAON Guardian 메시지`,
            description: document.getElementById('message').value || "다온과 함께하는 불꽃놀이",
            imageUrl: 'https://daon-fireworks-2025.vercel.app/og-image.png',
            link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
        }
    });

    shareCount++;
    localStorage.setItem('daon_share_count', shareCount);
    localStorage.setItem('daon_last_action', now);
    updateSystem();
};

function updateSystem() {
    const seal = document.getElementById('opal-seal');
    const rankTxt = document.getElementById('rank-text');
    const fill = document.getElementById('progress-fill');
    const info = document.getElementById('next-rank-info');
    const label = document.getElementById('rank-label');
    
    seal.className = '';
    let target = 0, base = 0, currentLabel = "WHITE";

    if (shareCount >= THRESHOLDS.ULTIMATE) {
        seal.classList.add('rank-ultimate');
        rankTxt.innerText = "RANK: ULTIMATE GUARDIAN";
        fill.style.width = "100%";
        info.innerText = "MAX LOYALTY";
        currentLabel = "ULTIMATE";
    } else if (shareCount >= THRESHOLDS.BLACK) {
        seal.classList.add('rank-black');
        rankTxt.innerText = "RANK: BLACK OPAL";
        target = THRESHOLDS.ULTIMATE; base = THRESHOLDS.BLACK; currentLabel = "BLACK";
    } else if (shareCount >= THRESHOLDS.FIRE) {
        seal.classList.add('rank-fire');
        rankTxt.innerText = "RANK: FIRE OPAL";
        target = THRESHOLDS.BLACK; base = THRESHOLDS.FIRE; currentLabel = "FIRE";
    } else {
        seal.classList.add('rank-white');
        target = THRESHOLDS.FIRE; base = 0; currentLabel = "WHITE";
    }

    if (target > 0) {
        const percent = ((shareCount - base) / (target - base)) * 100;
        fill.style.width = percent + "%";
        info.innerText = `NEXT: ${target} (${target - shareCount} left)`;
    }
    label.innerText = currentLabel;
}

window.toggleDrawer = (id) => {
    const d = document.getElementById(id);
    const isH = d.classList.contains('hidden');
    document.querySelectorAll('.drawer').forEach(el => el.classList.add('hidden'));
    if (isH) d.classList.remove('hidden');
};

window.onload = () => { initIdentity(); updateSystem(); };