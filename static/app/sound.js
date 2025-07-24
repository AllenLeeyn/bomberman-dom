// sound.js - Complete Sound Management System for Bomberman Game

class SoundManager {
    constructor() {
        this.muted = false;              
        this.volume = 0.5;               
        this.sounds = {};                
        this._loadAllSounds();           
    }

    // Private method to load all our sound files
    _loadAllSounds() {
        const soundsPath = '/static/app/sounds/';
        
        const soundFiles = {
        bombPlace: 'bombplace.mp3',     
        explosion: 'explosion.mp3',       
        powerup: 'powerup.mp3',        
        death: 'death.mp3',            
        countdown: 'countdown.mp3',     
        gameBGM: 'gameBGM.mp3',  
        lobbyBGM: 'lobbyBGM.mp3',   
        victory: 'victory.mp3',
        defeat: 'defeat.mp3'            
        };

        for (const [soundName, fileName] of Object.entries(soundFiles)) {
            const audioElement = new Audio(soundsPath + fileName);
            audioElement.volume = this.volume;           
            audioElement.preload = 'auto';               
            this.sounds[soundName] = audioElement;       

            if (soundName === 'gameBGM') {
                audioElement.loop = true;               
                audioElement.volume = 0.3;              
            }
        }
    }

    // Main method to play any sound by name
    play(soundName) {
        if (this.muted) {
        return;
        }

        const sound = this.sounds[soundName];
        if (!sound) {
        console.warn(`[Sound] Warning: Sound "${soundName}" not found!`);
        return;
        }

        try {
        sound.currentTime = 0;     
        sound.play().catch(error => {
            console.warn(`[Sound] Could not play "${soundName}":`, error.message);
        });
        } catch (error) {
        console.error(`[Sound] Error playing "${soundName}":`, error);
        }
    }

    // Method to change volume for all sounds
    setVolume(newVolume) {
        this.volume = Math.max(0, Math.min(1, newVolume));
        
        for (const sound of Object.values(this.sounds)) {
        sound.volume = this.volume;
        }      
    }

    // Toggle mute on/off
    toggleMute() {
        this.muted = !this.muted;
        console.log(`[Sound] ${this.muted ? 'Muted' : 'Unmuted'}`);
    }

    isMuted() {
        return this.muted;
    }

    getVolume() {
        return this.volume;
    }
}

// Create ONE instance of our sound manager (singleton pattern)
const soundManager = new SoundManager();

export function playBombPlace() {
    soundManager.play('bombPlace');
}

export function playExplosion() {
    soundManager.play('explosion');
}

export function playPowerup() {
    soundManager.play('powerup');
}

export function playDeath() {
    soundManager.play('death');
}

export function playCountdown() {
    soundManager.play('countdown');
}

export function startBackgroundMusic() {
    if (soundManager.muted) return;
    
    const bgMusic = soundManager.sounds.gameBGM;
    if (!bgMusic) {
        return;
    }
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
}

export function stopBackgroundMusic() {
    const bgMusic = soundManager.sounds.gameBGM;
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}


export function startLobbyMusic() {
    if (soundManager.muted) return;
    const bgMusic = soundManager.sounds.lobbyBGM;
    if (!bgMusic) {
        return;
    }
    if (bgMusic.paused) {
        // no reset
        autoPlay(bgMusic);
    }
}

export function stopLobbyMusic() {
    const bgMusic = soundManager.sounds.lobbyBGM;
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

export function playVictory() {
    soundManager.play('victory');
}

export function playDefeat() {
    soundManager.play('defeat');
}

export function setVolume(volume) {
    soundManager.setVolume(volume);
}

export function toggleMute() {
    soundManager.toggleMute();
}

export function isMuted() {
    return soundManager.isMuted();
}

export function getVolume() {
    return soundManager.getVolume();
}

export function fadeOutLobbyMusic(duration) {
    const bgMusic = soundManager.sounds.lobbyBGM;
    if (!bgMusic) return;
    const startVolume = bgMusic.volume;
    const steps = 20;
    let step = 0;
    const fade = setInterval(() => {
        step++;
        bgMusic.volume = Math.max(0, startVolume * (1 - step / steps));
        if (step >= steps) {
            clearInterval(fade);
            // console.log("LobbyBGM paused")
            bgMusic.pause();
            bgMusic.currentTime = 0;
            bgMusic.volume = startVolume; // reset for next time
        }
    }, duration / steps);
}

// auto-play policy workaround
function autoPlay(audio) {
    if (!audio) return;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
            // if blocked, wait for interaction
            const unlock = () => {
                audio.play();
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
            };
            window.addEventListener('pointerdown', unlock);
            window.addEventListener('keydown', unlock);
        });
    }
}
