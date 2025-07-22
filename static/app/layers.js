// Layers

// const tileLayer = document.getElementById('tile-layer');
// const bombLayer = document.getElementById('bomb-layer');
// const blockLayer = document.getElementById('block-layer');
// const exploLayer = document.getElementById('explosion-layer');
// const playerLayer = document.getElementById('player-layer');

// let tileLayer, blockLayer, bombLayer, exploLayer, playerLayer;

const LAYER_IDS = [
    'tile-layer',
    'bomb-layer',
    'block-layer',
    'explosion-layer',
    'player-layer'
]

const playerDirections = ['front', 'back', 'left', 'right'];
const playerColors = ['red', 'blue', 'green', 'yellow'];

export function useLayers(gameRoot) {
    LAYER_IDS.forEach(id => {
        if (!gameRoot.querySelector(`#${id}`)) {
        const div = document.createElement('div');
        div.id = id;
        div.className = 'game-layer';
        gameRoot.appendChild(div);
        }
    });

    return {
        tileLayer:   gameRoot.querySelector('#tile-layer'),
        blockLayer:  gameRoot.querySelector('#block-layer'),
        bombLayer:   gameRoot.querySelector('#bomb-layer'),
        exploLayer:  gameRoot.querySelector('#explosion-layer'),
        playerLayer: gameRoot.querySelector('#player-layer'),
    };
}

// Rendering: set a static image as tile layer
export function renderTileLayer(tileLayer, imageUrl, width = 720, height = 624) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = width + 'px';
    img.style.height = height + 'px';
    img.alt = "Board";
    tileLayer.appendChild(img);
}


export function createSpritePool(layer, max, assetKey, assets, className, w = 48, h = 48) {
    const pool = [];
    const asset = assets.getAsset(assetKey);
    const src = asset && asset.src ? asset.src : ""; // Fallback to blank if missing

    for (let i = 0; i < max; i++) {
        const img = document.createElement('img');
        img.src = src;
        img.className = className || '';
        img.style.position = 'absolute';
        img.style.width = w + 'px';
        img.style.height = h + 'px';
        img.style.left = '-9999px';
        img.style.top = '-9999px';
        img.style.display = 'none'; // hide by default
        layer.appendChild(img);
        pool.push(img);
    }
    return pool;
}

export function createPlayerSpritePool(playerLayer, maxPlayers, assets, PlayerSize = 36) {
    // Pool structure: { [playerId]: { [dir]: img } }
    const pool = {};
    for (let i = 0; i < maxPlayers; i++) {
        const playerId = `player_${i}`;
        pool[playerId] = {};
        for (const color of playerColors) {
            for (const dir of playerDirections) {
                const assetKey = `player_${color}_${dir}`;
                const asset = assets.getAsset(assetKey);
                const img = document.createElement('img');
                img.src = asset && asset.src ? asset.src : '';
                img.className = `player player-img dir-${dir} color-${color}`;
                img.id = `${playerId}_${color}_${dir}`;
                img.style.position = 'absolute';
                img.style.width = PlayerSize + 'px';
                img.style.height = (PlayerSize * 4/3) + 'px';
                img.style.left = '-9999px';
                img.style.top = '-9999px';
                img.style.display = 'none';
                playerLayer.appendChild(img);
                pool[playerId][`${color}_${dir}`] = img;
            }
        }
    }
    return pool;
}


