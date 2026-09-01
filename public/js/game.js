/* global socket, pad, Howl, animateCSS */
let timerID = 0;
let pickWordID = 0;
let hints = [];

const yourTurn = new Howl({
    src: ['audio/your-turn.mp3'],
});

const clock = new Howl({
    src: ['audio/clock.mp3'],
});

const correct = new Howl({
    src: ['audio/correct.mp3'],
});

const gameOver = new Howl({
    src: ['audio/gameover.mp3'],
});

const click = new Howl({
    src: ['audio/click.mp3'],
});

const timerStart = new Howl({
    src: ['audio/timer-start.mp3'],
});

const hint = new Howl({
    src: ['audio/hint.mp3'],
});

document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('mousedown', () => click.play());
});

function chooseWord(word) {
    clearTimeout(pickWordID);
    if (typeof pad !== 'undefined' && pad) pad.setReadOnly(false);
    if (typeof socket !== 'undefined') socket.emit('chooseWord', { word });
    const p = document.createElement('p');
    p.textContent = word;
    p.classList.add('lead', 'fw-bold', 'mb-0');
    const wordDiv = document.querySelector('#wordDiv');
    if (wordDiv) {
        wordDiv.innerHTML = '';
        wordDiv.append(p);
    }
}

function createScoreCard(players) {
    const playersContainer = document.querySelector('.players');
    if (!playersContainer) return;
    playersContainer.innerHTML = '';

    players.forEach((player) => {
        const div = document.createElement('div');
        const avatar = document.createElement('div');
        const details = document.createElement('div');
        const img = document.createElement('img');
        const p1 = document.createElement('p');
        const p2 = document.createElement('p');
        const name = document.createTextNode(player.name);
        const score = document.createTextNode('خاڵ: 0');

        img.src = player.avatar;
        img.classList.add('img-fluid', 'rounded-circle');
        div.classList.add('row', 'justify-content-end', 'py-1', 'align-items-center');
        avatar.classList.add('col-5', 'col-xl-4');
        details.classList.add('col-7', 'col-xl-6', 'text-center', 'my-auto');
        p1.classList.add('mb-0');
        p2.classList.add('mb-0');
        div.id = `skribblr-${player.id}`;
        div.append(details, avatar);
        avatar.append(img);
        details.append(p1, p2);
        p1.append(name);
        p2.append(score);
        playersContainer.append(div);
    });
}

function startTimer(ms) {
    let secs = ms / 1000;
    const id = setInterval((function updateClock() {
        const wordP = document.querySelector('#wordDiv > p.lead.fw-bold.mb-0');
        if (secs === 0) clearInterval(id);
        if (secs === 10) clock.play();
        const clockEl = document.querySelector('#clock');
        if (clockEl) clockEl.textContent = secs;
        if (hints[0] && wordP && secs === hints[0].displayTime && (typeof pad === 'undefined' || !pad || pad.readOnly)) {
            wordP.textContent = hints[0].hint;
            hint.play();
            animateCSS(wordP, 'tada', false);
            hints.shift();
        }
        secs--;
        return updateClock;
    }()), 1000);
    timerID = id;
    timerStart.play();
    document.querySelectorAll('.players .correct').forEach((player) => player.classList.remove('correct'));
}

function appendMessage({ name = '', message, id }, { correctGuess = false, closeGuess = false, lastWord = false } = {}) {
    const p = document.createElement('p');
    const chat = document.createTextNode(`${message}`);
    const messages = document.querySelector('.messages');
    if (!messages) return;

    if (name !== '') {
        const span = document.createElement('span');
        span.textContent = `${name}: `;
        span.classList.add('fw-bold');
        p.append(span);
    }
    p.classList.add('p-2', 'mb-0');
    if (closeGuess) p.classList.add('close');
    if (lastWord) p.classList.add('alert-warning');
    if (correctGuess) {
        const playerCard = document.getElementById(`skribblr-${id}`);
        if (playerCard) playerCard.classList.add('correct');
        p.classList.add('correct');
    }
    p.append(chat);
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
    if (message === 'ڕاستت زانی!') correct.play();
}

if (typeof socket !== 'undefined') {
    socket.on('getPlayers', (players) => createScoreCard(players));
    socket.on('choosing', ({ name }) => {
        const p = document.createElement('p');
        p.textContent = `${name} سەرقاڵی هەڵبژاردنی وشەیە`;
        p.classList.add('lead', 'fw-bold', 'mb-0');
        const wordDiv = document.querySelector('#wordDiv');
        if (wordDiv) {
            wordDiv.innerHTML = '';
            wordDiv.append(p);
        }
        const clockEl = document.querySelector('#clock');
        if (clockEl) clockEl.textContent = 0;
        clearInterval(timerID);
        clock.stop();
    });

    socket.on('settingsUpdate', (data) => {
        if (document.querySelector('#rounds')) document.querySelector('#rounds').value = data.rounds;
        if (document.querySelector('#time')) document.querySelector('#time').value = data.time;
    });

    socket.on('hints', (data) => { hints = data; });

    socket.on('chooseWord', async ([word1, word2, word3]) => {
        const p = document.createElement('p');
        const btn1 = document.createElement('button');
        const btn2 = document.createElement('button');
        const btn3 = document.createElement('button');
        const text = document.createTextNode('وشەیەک هەڵبژێرە');
        btn1.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2', 'my-1');
        btn2.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2', 'my-1');
        btn3.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2', 'my-1');
        p.classList.add('lead', 'fw-bold', 'mb-2');
        btn1.textContent = word1;
        btn2.textContent = word2;
        btn3.textContent = word3;
        btn1.addEventListener('click', () => chooseWord(word1));
        btn2.addEventListener('click', () => chooseWord(word2));
        btn3.addEventListener('click', () => chooseWord(word3));
        p.append(text);
        const wordDiv = document.querySelector('#wordDiv');
        if (wordDiv) {
            wordDiv.innerHTML = '';
            wordDiv.append(p, btn1, btn2, btn3);
        }
        const tools = document.querySelector('#tools');
        if (tools) {
            tools.classList.remove('d-none');
            await animateCSS('#tools', 'fadeInUp');
        }
        const clockEl = document.querySelector('#clock');
        if (clockEl) clockEl.textContent = 0;
        clearInterval(timerID);
        clock.stop();
        yourTurn.play();
        pickWordID = setTimeout(() => chooseWord(word2), 15000);
    });

    socket.on('hideWord', ({ word }) => {
        const p = document.createElement('p');
        p.textContent = word;
        p.classList.add('lead', 'fw-bold', 'mb-0');
        p.style.letterSpacing = '0.5em';
        const wordDiv = document.querySelector('#wordDiv');
        if (wordDiv) {
            wordDiv.innerHTML = '';
            wordDiv.append(p);
        }
    });

    socket.on('startTimer', ({ time }) => startTimer(time));
    socket.on('message', appendMessage);
    socket.on('closeGuess', (data) => appendMessage(data, { closeGuess: true }));
    socket.on('correctGuess', (data) => appendMessage(data, { correctGuess: true }));
    socket.on('lastWord', ({ word }) => appendMessage({ message: `وشەکە ${word} بوو` }, { lastWord: true }));

    socket.on('updateScore', ({
        playerID,
        score,
        drawerID,
        drawerScore,
    }) => {
        const playerEl = document.querySelector(`#skribblr-${playerID}>div p:last-child`);
        const drawerEl = document.querySelector(`#skribblr-${drawerID}>div p:last-child`);
        if (playerEl) playerEl.textContent = `خاڵ: ${score}`;
        if (drawerEl) drawerEl.textContent = `خاڵ: ${drawerScore}`;
    });

    socket.on('endGame', async ({ stats }) => {
        let players = Object.keys(stats).filter((val) => val.length === 20);
        players = players.sort((id1, id2) => stats[id2].score - stats[id1].score);

        clearInterval(timerID);
        const clockEl = document.querySelector('#clock');
        if (clockEl) clockEl.textContent = 0;
        const gameZone = document.querySelector('#gameZone');
        if (gameZone) {
            await animateCSS('#gameZone', 'fadeOutLeft');
            gameZone.remove();
        }

        players.forEach((playerID, index) => {
            const row = document.createElement('div');
            const rankDiv = document.createElement('div');
            const imgDiv = document.createElement('div');
            const nameDiv = document.createElement('div');
            const scoreDiv = document.createElement('div');
            const rank = document.createElement('span');
            const name = document.createElement('p');
            const score = document.createElement('p');
            const avatar = new Image();

            avatar.src = stats[playerID].avatar;
            name.textContent = stats[playerID].name;
            score.textContent = `${stats[playerID].score} خاڵ`;

            rank.textContent = `#${index + 1}`;
            rank.classList.add('fw-bold', 'text-muted');

            row.classList.add('row', 'mx-0', 'align-items-center');
            avatar.classList.add('img-fluid', 'rounded-circle');
            rankDiv.classList.add('col-2', 'col-sm-1', 'text-center');
            imgDiv.classList.add('col-3', 'col-sm-2', 'text-center');
            nameDiv.classList.add('col-4', 'col-sm-6', 'text-start');
            scoreDiv.classList.add('col-3', 'col-sm-3', 'text-end');
            name.classList.add('h5', 'mb-0', 'fw-bold');
            score.classList.add('h5', 'mb-0', 'fw-bold', 'text-gradient');

            rankDiv.append(rank);
            imgDiv.append(avatar);
            nameDiv.append(name);
            scoreDiv.append(score);
            row.append(rankDiv, imgDiv, nameDiv, scoreDiv);
            const statsDiv = document.querySelector('#statsDiv');
            if (statsDiv) statsDiv.append(row, document.createElement('hr'));
        });
        clock.stop();
        gameOver.play();
        const gameEnded = document.querySelector('#gameEnded');
        if (gameEnded) {
            gameEnded.classList.remove('d-none');
            animateCSS('#gameEnded>div', 'fadeInRight');
        }
    });
}

const sendMsgForm = document.querySelector('#sendMessage');
if (sendMsgForm) {
    sendMsgForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = this.querySelector('input');
        if (!input) return;
        const message = input.value;
        input.value = '';
        if (typeof socket !== 'undefined') socket.emit('message', { message });
    });
}
