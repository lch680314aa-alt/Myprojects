// [1] 카톡 탈출 로직
(function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('kakaotalk') > -1 && ua.indexOf('android') > -1) {
        location.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
    }
})();

// [2] 카카오 초기화 (사용자님의 자바스크립트 키를 꼭 넣어주세요)
const KAKAO_KEY = 'YOUR_JAVASCRIPT_KEY'; 
if (!window.Kakao.isInitialized()) { window.Kakao.init(KAKAO_KEY); }

let player;
window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
        videoId: 'WPfyXfdrCqs',
        playerVars: { 'autoplay': 1, 'mute': 1, 'controls': 0, 'loop': 1, 'playlist': 'WPfyXfdrCqs' },
        events: { 'onReady': (e) => e.target.playVideo() }
    });
};

// [3] 버튼 로직
window.openChoiceModal = () => {
    const btn = document.getElementById('action-btn');
    if (btn.classList.contains('send-mode')) {
        shareToKakao(false);
        return;
    }
    document.getElementById('choice-modal').style.display = 'block';
};

window.executeLaunch = (withSound) => {
    document.getElementById('choice-modal').style.display = 'none';
    if (withSound && player) { player.unMute(); player.setVolume(80); }

    const btn = document.getElementById('action-btn');
    btn.innerText = "SEND";
    btn.classList.add('send-mode');

    // 폭죽 3회 연사 (애니메이션 로직이 이미 있다면 여기에 연동)
    alert("🎆 3회 연속 폭죽 발사!"); 
};

window.shareToKakao = (isGift) => {
    const nick = document.getElementById('user-nickname').value || "다온";
    const msg = isGift ? "특별한 테마를 선물합니다!" : document.getElementById('user-input').value;

    window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: `[다온 2025] ${nick}님의 메시지`,
            description: msg,
            imageUrl: 'https://daon-fireworks-2025.vercel.app/og-image.png',
            link: { mobileWebUrl: window.location.href, webUrl: window.location.href }
        },
        buttons: [{ title: '확인하기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }]
    });
};

window.toggleMusicDrawer = () => {
    document.getElementById('music-drawer').classList.toggle('hidden');
};