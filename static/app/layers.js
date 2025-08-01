const LAYER_IDS = [
    'pool-layer',
    'tile-layer',
    'spike-layer',
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
        poolLayer:   gameRoot.querySelector('#pool-layer'),
        tileLayer:   gameRoot.querySelector('#tile-layer'),
        spikeLayer:  gameRoot.querySelector('#spike-layer'),
        blockLayer:  gameRoot.querySelector('#block-layer'),
        bombLayer:   gameRoot.querySelector('#bomb-layer'),
        exploLayer:  gameRoot.querySelector('#explosion-layer'),
        playerLayer: gameRoot.querySelector('#player-layer'),
    };
}

export function createSpritePool(layer, max, assetKey, assets, w = 48, h = 48) {
    const pool = [];
    const asset = assets.getAsset(assetKey);
    const src = asset && asset.src ? asset.src : "";

    for (let i = 0; i < max; i++) {
        const div = document.createElement('div');
        div.style.width = w + 'px';
        div.style.height = h + 'px';
        div.style.backgroundImage = `url("${src}")`;
        div.style.backgroundSize = 'cover';

        div.style.display = 'none';
        div.style.gridRow = '1';
        div.style.gridColumn = '1';

        layer.appendChild(div);
        pool.push(div);
    }
    return pool;
}

export function clearLayers(gameRoot) {
    LAYER_IDS.forEach(id => {
        const layer = gameRoot.querySelector(`#${id}`);
        if (layer) {
            while (layer.firstChild) {
                layer.removeChild(layer.firstChild);
            }
        }
    });
}
