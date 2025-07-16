const assets = {}; // Central store for all loaded assets

const assetTypes = {
    IMAGE: 'image',
    AUDIO: 'audio',
};

const typeFromExtension = {
    '.png': assetTypes.IMAGE,
    '.jpg': assetTypes.IMAGE,
    '.jpeg': assetTypes.IMAGE,
    '.gif': assetTypes.IMAGE,
    '.webp': assetTypes.IMAGE,
    '.mp3': assetTypes.AUDIO,
    '.wav': assetTypes.AUDIO,
    '.ogg': assetTypes.AUDIO,
};

function getFileExtension(path) {
    return path.slice((Math.max(0, path.lastIndexOf(".")) || Infinity)).toLowerCase();
}

function loadImage(key, path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
        assets[key] = img;
        resolve({ key, asset: img });
        };
        img.onerror = (e) => {
        console.warn(`Failed to load image: ${path}`);
        reject(e);
        };
        img.src = path;
    });
}

function loadAudio(key, path) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
        assets[key] = audio;
        resolve({ key, asset: audio });
        };
        audio.onerror = (e) => {
        console.warn(`Failed to load audio: ${path}`);
        reject(e);
        };
        audio.src = path;
        audio.load();
    });
}

async function load(assetList = [], onProgress = null) {
    const tasks = assetList.map(({ key, path }, i) => {
    const ext = getFileExtension(path);
    const type = typeFromExtension[ext];

    if (!type) {
        throw new Error(`Unsupported asset type for: ${path}`);
    }

    const loaderFn = type === assetTypes.IMAGE ? loadImage : loadAudio;

    return loaderFn(key, path).then(result => {
        if (typeof onProgress === 'function') {
            onProgress((i + 1) / assetList.length, result.key);
        }
        return result;
        });
    });

    await Promise.all(tasks);
}

function getAsset(key) {
    const asset = assets[key];
    if (!asset) {
        console.warn(`Asset not found: ${key}`);
    }
    return asset;
}

// Reset or clear assets; if needed
function clearAssets() {
    for (const key in assets) {
        delete assets[key];
    }
}

// Export as named module
export { load, getAsset, clearAssets };
