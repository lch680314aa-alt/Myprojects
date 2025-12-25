const KAKAO_KEY = 'fa462b2b643a16d837c1890cc3dc4149';
if (!Kakao.isInitialized()) Kakao.init(KAKAO_KEY);

let shareCount = parseInt(localStorage.getItem('daon_share_count') || '0');
let sosTimer;

// [1] 폭죽 3회 연속 발사 로직
async function fireworkBurst(message, count = 3) {
    for(let i = 0; i < count; i++) {
        await new Promise(resolve => {
            console.log(`폭죽 발사: ${message}`);
            // 여기에 실제 Canvas 폭죽 애니메이션 실행 함수 호출 (화면 중앙 하단 -> 상단 터짐)
            triggerCanvasFirework(message); 
            setTimeout(resolve, 2000); // 이전 폭죽이 사라지는 시간 대기
        });
    }
}

function handleLaunch() {
    const msg = document.getElementById('message').value;
    const nick = document.getElementById('nickname').value;
    
    // 3회 발사 및 버튼 전환
    fireworkBurst(msg);
    const btn = document.getElementById('launch-btn');
    btn.innerText = "SEND TO KAKAO";
    btn.onclick = () => shareToKakao(nick, msg);
}

// [2] 카카오 공유 (선물하기 통합)
function shareToKakao(nick, msg, type = 'all') {
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `🎆 ${nick}님의 불꽃 선물`,
            description: msg,
            imageUrl: 'https://daon-fireworks-2025.vercel.app/og-image.png',
            link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
        }
    });
    
    shareCount++;
    localStorage.setItem('daon_share_count', shareCount);
    checkGoldSeal();
}

// [3] 충성고객 황금인장 (1000회)
function checkGoldSeal() {
    if (shareCount >= 1000) {
        const seal = document.getElementById('gold-seal');
        seal.classList.remove('hidden');
        setTimeout(() => seal.classList.add('hidden'), 3000);
    }
}

// [4] 긴급 호출 (SOS) 시크릿 로직
window.startEmergencyPress = () => {
    sosTimer = setTimeout(() => {
        // 20초 롱프레스 시 진동 및 경찰 신고 시뮬레이션
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        alert("🚨 시크릿 SOS: 위치 정보가 경찰 상황실로 전송되었습니다.");
    }, 20000);
};
window.endEmergencyPress = () => clearTimeout(sosTimer);

// [5] 병원 도우미
window.showHospitals = () => {
    alert("가장 가까운 응급실:\n1. OO대학병원 (02-123-4567)\n2. XX종합병원 (02-987-6543)");
};

// [6] 밀프랩 인쇄 및 저장
window.printRecipe = () => {
    const content = document.getElementById('meal-input').value;
    const win = window.open('', '', 'height=500,width=500');
    win.document.write(`<html><body><h1>DAON Meal-Prep</h1><p>${content}</p></body></html>`);
    win.print();
};

window.onload = () => {
    // 처음 입장 시 랜덤 폭죽 시작
    setInterval(() => triggerCanvasFirework("DAON 2025"), 5000);
};