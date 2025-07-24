    // sound.js - Complete Sound Management System for Bomberman Game

class SoundManager {
    constructor() {
        this.muted = false;              // Is sound currently muted?
        this.volume = 0.5;               // Volume level (0 to 1, where 0.5 = 50%)
        this.sounds = {};                // Object to store all our audio files
        this._loadAllSounds();           // Load all sound files when created
    }

    // Private method to load all our sound files
    _loadAllSounds() {
        // Base path to our sounds folder (absolute path prevents issues)
        const soundsPath = '/static/app/sounds/';
        
        // Map of sound names to actual filenames
        const soundFiles = {
        bombPlace: 'bombplace.mp3',     // When player places a bomb
        explosion: 'explosion.mp3',       // When bomb explodes
        powerup: 'powerup.mp3',          // When player collects power-up
        death: 'death.mp3',              // When player dies
        countdown: 'countdown.mp3',     // For countdown GO!
        gameBGM: 'gameBGM.mp3',      // Background music for the game
        victory: 'victory.mp3'         // When player wins the game     
        };

        // Create Audio objects for each sound file
        for (const [soundName, fileName] of Object.entries(soundFiles)) {
        const audioElement = new Audio(soundsPath + fileName);
        audioElement.volume = this.volume;           // Set initial volume
        audioElement.preload = 'auto';               // Tell browser to preload
        this.sounds[soundName] = audioElement;       // Store in our sounds object

        if (soundName === 'gameBGM') {
        audioElement.loop = true;                // Make it loop automatically
        audioElement.volume = 0.3;               // Lower volume for background
        }
        
        // Optional: Log when sound is loaded (helpful for debugging)
        console.log(`[Sound] Loaded: ${soundName} from ${fileName}`);
        }
    }

    // Main method to play any sound by name
    play(soundName) {
        // Don't play if muted
        if (this.muted) {
        return;
        }

        // Get the sound from our collection
        const sound = this.sounds[soundName];
        
        // Check if sound exists
        if (!sound) {
        console.warn(`[Sound] Warning: Sound "${soundName}" not found!`);
        return;
        }

        try {
        // Reset to beginning (in case it's already playing)
        sound.currentTime = 0;
        
        // Play the sound (returns a Promise, so we catch errors)
        sound.play().catch(error => {
            console.warn(`[Sound] Could not play "${soundName}":`, error.message);
        });
        } catch (error) {
        console.error(`[Sound] Error playing "${soundName}":`, error);
        }
    }

    // Method to change volume for all sounds
    setVolume(newVolume) {
        // Ensure volume is between 0 and 1
        this.volume = Math.max(0, Math.min(1, newVolume));
        
        // Update volume for all loaded sounds
        for (const sound of Object.values(this.sounds)) {
        sound.volume = this.volume;
        }
        
        console.log(`[Sound] Volume set to: ${Math.round(this.volume * 100)}%`);
    }

    // Toggle mute on/off
    toggleMute() {
        this.muted = !this.muted;
        console.log(`[Sound] ${this.muted ? 'Muted' : 'Unmuted'}`);
    }

    // Check if currently muted
    isMuted() {
        return this.muted;
    }

    // Get current volume
    getVolume() {
        return this.volume;
    }
}

// Create ONE instance of our sound manager (singleton pattern)
const soundManager = new SoundManager();

// Export simple functions that game can use
// The functions to import in game.js

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

export function playCountdown() {
    soundManager.play('countdown');
}

export function startBackgroundMusic() {
    if (soundManager.muted) return;
    
    const bgMusic = soundManager.sounds.gameBGM;
    if (!bgMusic) {
        console.warn('[Sound] Background music not found!');
        return;
    }
    
    try {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(error => {
            console.warn('[Sound] Could not start background music:', error.message);
        });
        console.log('[Sound] Background music started');
    } catch (error) {
        console.error('[Sound] Error starting background music:', error);
    }
}

export function stopBackgroundMusic() {
    const bgMusic = soundManager.sounds.gameBGM;
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        console.log('[Sound] Background music stopped');
    }
}

export function playVictory() {
    soundManager.play('victory');
}


// Export the manager itself for advanced usage (optional)
export { soundManager };
