/* eslint-disable func-names */
/* global socket, my, Howl, updatePlayerData, pad, canvas */
const params = window.location.toString().substring(window.location.toString().indexOf('?'));
const searchParams = new URLSearchParams(params);
const copyBtn = document.querySelector('#copy');

const pop = new Howl({
    src: ['audio/pop.mp3'],
});

const exit = new Howl({
    src: ['audio/exit.mp3'],
});

function animateCSS(element, animation, selector = true) {
    return new Promise((resolve) => {
        const animationName = `animate__${animation}`;
        const node = selector ? document.querySelector(element) : element;
        if (!node) {
            resolve('Node not found');
            return;
        }

        node.classList.add('animate__animated', animationName);
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove('animate__animated', animationName);
            resolve('Animation ended');
        }
        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });
}

function updateSettings(e) {
    if (e) e.preventDefault();
    if (typeof socket === 'undefined') return;
    socket.emit('settingsUpdate', {
        rounds: document.querySelector('#rounds') ? document.querySelector('#rounds').value : 2,
        time: document.querySelector('#time') ? document.querySelector('#time').value : 40,
        customWords: document.querySelector('#customWords') ? Array.from(new Set(document.querySelector('#customWords').value.split('\n').map((word) => word.trim()).filter((word) => word !== ''))) : [],
        probability: document.querySelector('#probability') ? document.querySelector('#probability').value : 0,
    });
}

function putPlayer(player) {
    if (!player) return;
    const existing = document.querySelector(`#skribblr-${player.id}`);
    if (existing) return;

    const div = document.createElement('div');
    const img = document.createElement('img');
    const p = document.createElement('p');
    const text = document.createTextNode(player.name || 'یاریزان');
    div.id = `skribblr-${player.id}`;
    p.appendChild(text);
    p.classList.add('text-center');
    img.src = player.avatar;
    img.alt = player.name || 'ئەڤەتار';
    img.classList.add('img-fluid', 'rounded-circle');
    div.classList.add('col-4', 'col-sm-3', 'col-md-4', 'col-lg-3');
    div.appendChild(img);
    div.appendChild(p);
    
    const playersDiv = document.querySelector('#playersDiv');
    if (playersDiv) {
        playersDiv.appendChild(div);
        try { pop.play(); } catch (err) { /* ignore */ }
    }
}

function showCanvasArea() {
    console.log('Transitioning to Game Zone...');
    const landingEl = document.querySelector('#landing');
    const settingsEl = document.querySelector('#settings');
    const gameZoneEl = document.querySelector('#gameZone');

    if (landingEl) landingEl.classList.add('d-none');
    if (settingsEl) settingsEl.classList.add('d-none');
    if (gameZoneEl) {
        gameZoneEl.classList.remove('d-none');
        setTimeout(() => {
            if (typeof pad !== 'undefined' && pad && canvas && canvas.offsetWidth > 0) {
                pad.resize(canvas.offsetWidth);
            }
        }, 50);
    }
}

// Global Socket Listeners
if (typeof socket !== 'undefined') {
    socket.on('newPrivateRoom', (data) => {
        console.log('Room created with ID:', data.gameID);
        const gameLink = document.querySelector('#gameLink');
        if (gameLink) {
            gameLink.value = `${window.location.protocol}//${window.location.host}/?id=${data.gameID}`;
        }
        if (typeof my !== 'undefined') {
            my.id = socket.id;
            putPlayer(my);
        }
    });

    socket.on('joinRoom', putPlayer);
    socket.on('otherPlayers', (players) => players.forEach((player) => putPlayer(player)));
    socket.on('disconnection', async (player) => {
        const playerCard = document.querySelector(`#skribblr-${player.id}`);
        if (playerCard) {
            try { exit.play(); } catch (err) { /* ignore */ }
            playerCard.remove();
        }
    });
    socket.on('startGame', showCanvasArea);
}

// Room Creation & Join Actions
function handleCreateRoom(e) {
    if (e) e.preventDefault();
    const playerNameInput = document.querySelector('#playerName');
    const name = playerNameInput && playerNameInput.value.trim() ? playerNameInput.value.trim() : 'یاریزان';
    if (playerNameInput) playerNameInput.value = name;
    
    console.log('Create room clicked', name);
    
    if (typeof updatePlayerData === 'function') updatePlayerData();
    if (typeof my !== 'undefined') {
        my.name = name;
        my.id = socket ? socket.id : '';
    }

    // Immediately hide landing and show settings lobby
    const landingEl = document.querySelector('#landing');
    const settingsEl = document.querySelector('#settings');
    if (landingEl) landingEl.classList.add('d-none');
    if (settingsEl) settingsEl.classList.remove('d-none');

    // Emit socket event immediately
    if (typeof socket !== 'undefined') {
        socket.emit('newPrivateRoom', my);
    }
}

function handleJoinRoom(e) {
    if (e) e.preventDefault();
    const playerNameInput = document.querySelector('#playerName');
    const name = playerNameInput && playerNameInput.value.trim() ? playerNameInput.value.trim() : 'یاریزان';
    if (playerNameInput) playerNameInput.value = name;
    
    console.log('Join room clicked', name);
    
    if (typeof updatePlayerData === 'function') updatePlayerData();
    if (typeof my !== 'undefined') {
        my.name = name;
        my.id = socket ? socket.id : '';
    }

    // Immediately hide landing and show settings lobby
    const landingEl = document.querySelector('#landing');
    const settingsEl = document.querySelector('#settings');
    if (landingEl) landingEl.classList.add('d-none');
    if (settingsEl) settingsEl.classList.remove('d-none');

    const gameId = searchParams.get('id');
    const gameLink = document.querySelector('#gameLink');
    if (gameLink) {
        gameLink.value = `${window.location.protocol}//${window.location.host}/?id=${gameId}`;
    }
    putPlayer(my);

    if (typeof socket !== 'undefined') {
        socket.emit('joinRoom', { id: gameId, player: my });
    }
}

// Event Bindings
const createBtn = document.querySelector('#createRoom');
if (createBtn) {
    createBtn.addEventListener('click', handleCreateRoom);
}

const playBtn = document.querySelector('#playGame');
if (playBtn) {
    playBtn.addEventListener('click', handleJoinRoom);
}

const playerNameInput = document.querySelector('#playerName');
if (playerNameInput) {
    playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (createBtn) handleCreateRoom(e);
            else if (playBtn) handleJoinRoom(e);
        }
    });
}

// Disable host settings for joining players
if (searchParams.has('id')) {
    if (document.querySelector('#rounds')) document.querySelector('#rounds').setAttribute('disabled', true);
    if (document.querySelector('#time')) document.querySelector('#time').setAttribute('disabled', true);
    if (document.querySelector('#startGame')) document.querySelector('#startGame').setAttribute('disabled', true);
} else {
    if (document.querySelector('#rounds')) document.querySelector('#rounds').addEventListener('input', updateSettings);
    if (document.querySelector('#time')) document.querySelector('#time').addEventListener('input', updateSettings);
    if (document.querySelector('#customWords')) {
        document.querySelector('#customWords').addEventListener('change', updateSettings);
    }
    if (document.querySelector('#probability')) {
        document.querySelector('#probability').addEventListener('change', updateSettings);
    }
}

if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const linkInput = document.querySelector('#gameLink');
        if (linkInput) {
            linkInput.select();
            document.execCommand('copy');
            copyBtn.textContent = 'کۆپیکرا!';
            setTimeout(() => { copyBtn.textContent = 'کۆپیکردنی بەستەر'; }, 2000);
        }
    });
}

const startBtn = document.querySelector('#startGame');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        console.log('Start game button clicked');
        showCanvasArea();
        if (typeof socket !== 'undefined') {
            socket.emit('startGame');
            socket.emit('getPlayers');
        }
    });
}
