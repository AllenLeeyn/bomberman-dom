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






// export function createBombPool(bombLayer, maxBombs = 13, bombImgUrl, w = 48, h = 48) {
//     const bombPool = [];
//     for (let i = 0; i < maxBombs; i++) {
//         const img = document.createElement('img');
//         img.src = bombImgUrl;
//         img.style.position = 'absolute';
//         img.style.width = w + 'px';
//         img.style.height = h + 'px';
//         img.style.left = '-9999px'; 
//         img.style.top = '-9999px';
//         bombLayer.appendChild(img);
//         bombPool.push(img);
//     }
//     return bombPool;
// }


// export function createExplosionPool(exploLayer, maxExplo = 80, exploImgUrl, w=48, h=48) {
//     const exploPool = [];
//     for (let i = 0; i <= maxExplo; i++) {
//         const img = document.createElement('img');
//         img.src = exploImgUrl;
//         img.dataset.src = exploImgUrl;
//         img.style.position = 'absolute';
//         img.style.width = w + 'px';
//         img.style.height = w + 'px';
//         img.style.left = '-9999px';
//         img.style.top = '-9999px';
//         img.style.display = 'none';
//         exploLayer.appendChild(img);
//         exploPool.push(img);
//     }
//     return exploPool;
// }

