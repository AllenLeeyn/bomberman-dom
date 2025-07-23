export function playSound(soundName, assets) {
    const sound = assets.getAsset(soundName);
    if (sound && sound.src) {
        const audio = new Audio(sound.src);
        audio.play().catch(error => {
            console.error(`Error playing sound ${soundName}:`, error);
        });
    } else {
        console.warn(`Sound asset ${soundName} not found or missing src.`);
    }
}

