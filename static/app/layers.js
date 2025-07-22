/* 
What is layers.js for?

1. Check if the parent layer node exists on the DOM
    if it doesn't exist, create it.
    if it exist, continue

2. Return the layer to the top level logic into game.js where it game.js should generate all logic.
    Centralizing to game.js

3. Create each layer so we are able to return it to top.

Layers:
1. tileLayer = background Image
2. bombLayer = Bomb placement; power-up for now
3. blockLayer = destroyable and un-destroyable blocks
4. exploLayer = when bomb on bomblayer disappears after 2sec, visuals will be on this level 
5. playerLayer = player 2 to 4 


*/

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

// export function renderLayerAll(layers, gameData, assets) {

// }


// Rendering: set a static image as tile layer
export function renderTileLayer(tileLayer, imageUrl, width = 720, height = 624) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = width + 'px';
    img.style.height = height + 'px';
    img.alt = "Board";
    tileLayer.appendChild(img);
}


export function createBombPool(bombLayer, maxBombs = 13, bombImgUrl, w = 48, h = 48) {
    const bombPool = [];
    for (let i = 0; i < maxBombs; i++) {
        const img = document.createElement('img');
        img.src = bombImgUrl;
        img.style.position = 'absolute';
        img.style.width = w + 'px';
        img.style.height = h + 'px';
        img.style.left = '-9999px'; 
        img.style.top = '-9999px';
        bombLayer.appendChild(img);
        bombPool.push(img);
    }
    return bombPool;
}


export function createExplosionPool(exploLayer, maxExplo = 80, exploImgUrl, w=48, h=48) {
    const exploPool = [];
    for (let i = 0; i <= maxExplo; i++) {
        const img = document.createElement('img');
        img.src = exploImgUrl;
        img.dataset.src = exploImgUrl;
        img.style.position = 'absolute';
        img.style.width = w + 'px';
        img.style.height = w + 'px';
        img.style.left = '-9999px';
        img.style.top = '-9999px';
        img.style.display = 'none';
        exploLayer.appendChild(img);
        exploPool.push(img);
    }
    return exploPool;
}



// function createPlayerLayer(maxPlayers = 4) {
//     const div = document.createElement('div');
//     div.id = 'player-layer';
//     div.className = 'game-layer';

//     div.playerPool = [];
//     for (let i = 0; i < maxPlayers; ++i) {
//         const playerDiv = document.createElement('div');
//         playerDiv.className = 'player';
//         playerDiv.style.display = 'none';
//         div.appendChild(playerDiv);
//         div.playerPool.push(playerDiv);
//     }
//     return div;
// }

