class AssetManager {
    constructor() {
        this.assets = {};

        this.assetTypes = {
            IMAGE: 'image',
            AUDIO: 'audio',
        };

        // Static extension-to-type mapping (object literal)
        this.typeFromExtension = {
            '.png': this.assetTypes.IMAGE,
            '.jpg': this.assetTypes.IMAGE,
            '.jpeg': this.assetTypes.IMAGE,
            '.gif': this.assetTypes.IMAGE,
            '.webp': this.assetTypes.IMAGE,
            '.mp3': this.assetTypes.AUDIO,
            '.wav': this.assetTypes.AUDIO,
            '.ogg': this.assetTypes.AUDIO,
        };
    }

    // file extension checker
    getFileExtension(path) {
        return path.slice((Math.max(0, path.lastIndexOf('.')) || Infinity)).toLowerCase();
    }

    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                this.assets[key] = img;
                resolve({ key, asset: img });
            };
            img.onerror = (e) => {
                console.warn(`Failed to load image: ${path}`);
                reject(e);
            }
            img.src = path;
        });
    }

    loadAudio(key, path) {
        return new Promise((resolve, reject) => {
            const audio = new window.Audio();
            audio.oncanplaythrough = () => {
                this.assets[key] = audio;
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

    async load(assetList = [], onProgress = null) {
        let loaded = 0;
        for (let i = 0; i < assetList.length; i++) {
            const { key, path } = assetList[i];
            const ext = this.getFileExtension(path).toLowerCase();
            const type = this.typeFromExtension[ext];

            if (!type) {
                throw new Error(`Unsupported asset type for: ${path}`);
            }
            try {
                if (type === this.assetTypes.IMAGE) {
                    await this.loadImage(key, path);
                } else if (type === this.assetTypes.AUDIO) {
                    await this.loadAudio(key, path);
                } // can add more types here with else if

                loaded++;
                if (typeof onProgress === 'function') {
                    onProgress(loaded / assetList.length, key);
                }
            } catch (e) {
                console.error(`Error loading asset [${key}]: ${e}`);
            }
        }
    }

    getAsset(key) {
        const asset = this.assets[key];
        if (!asset) {
            console.warn(`Asset not found: ${key}`);
        }
        return asset;
    }

    clearAssets() {
        this.assets = {};
    }
}

export default AssetManager;
