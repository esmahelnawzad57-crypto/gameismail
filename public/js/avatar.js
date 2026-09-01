const style = document.querySelector('#style');
const bgColor = document.querySelector('#bgColor');
const playerName = document.querySelector('#playerName');

function generateAvatar(name = '', styleVal = 'Avataaars', colorVal = '#00f2fe') {
    const rawName = (name || '').trim();
    const initial = rawName.length > 0 ? rawName.slice(0, 2) : '👤';
    const bg = (colorVal || '#00f2fe').startsWith('#') ? colorVal : `#${colorVal}`;
    
    // Choose icon / styling accent based on styleVal
    let glyph = initial;
    if (styleVal === 'Bottts') glyph = '🤖';
    else if (styleVal === 'Female') glyph = '👩';
    else if (styleVal === 'Male') glyph = '👨';
    else if (styleVal === 'Human') glyph = '🧑';
    else if (styleVal === 'Identicon' || styleVal === 'Jdenticon' || styleVal === 'Gridy') glyph = '🎨';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
            <linearGradient id="g_${encodeURIComponent(styleVal)}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${bg}" />
                <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g_${encodeURIComponent(styleVal)})" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
        <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${glyph}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const savedName = localStorage.getItem('name') || '';
const savedColor = localStorage.getItem('bgColor') || '#00f2fe';
const savedStyle = localStorage.getItem('style') || 'Avataaars';

const my = {
    name: savedName,
    avatar: generateAvatar(savedName, savedStyle, savedColor),
};

function updatePlayerData() {
    const currentName = playerName && playerName.value.trim() ? playerName.value.trim() : (my.name || 'یاریزان');
    const currentStyle = style ? style.value : savedStyle;
    const currentColor = bgColor ? bgColor.value : savedColor;
    
    my.name = currentName;
    my.avatar = generateAvatar(currentName, currentStyle, currentColor);
    
    localStorage.setItem('name', currentName);
    localStorage.setItem('style', currentStyle);
    localStorage.setItem('bgColor', currentColor);
}

if (playerName && savedName) playerName.value = savedName;
if (bgColor && savedColor) bgColor.value = savedColor;
if (style && savedStyle) style.value = savedStyle;
updatePlayerData();

if (style) style.addEventListener('input', updatePlayerData);
if (bgColor) bgColor.addEventListener('input', updatePlayerData);
if (playerName) {
    playerName.addEventListener('input', updatePlayerData);
    playerName.addEventListener('change', updatePlayerData);
}
