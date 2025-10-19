import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

class SoundManager {
  private sounds: Map<string, Sound> = new Map();
  private isMuted: boolean = false;
  private volume: number = 1.0; // 0.0 to 1.0

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  async loadSound(name: string, source: any) {
    try {
      const { sound } = await Audio.Sound.createAsync(source);
      this.sounds.set(name, sound);
      console.log(`✅ Loaded sound: ${name}`);
    } catch (error) {
      console.error(`❌ Error loading sound ${name}:`, error);
    }
  }

  async playSound(name: string) {
    if (this.isMuted) {
      console.log(`🔇 Sound ${name} muted`);
      return;
    }

    try {
      const sound = this.sounds.get(name);
      if (sound) {
        console.log(`🔊 Playing sound: ${name} at volume ${this.volume}`);
        await sound.setVolumeAsync(this.volume);
        await sound.replayAsync();
      } else {
        console.warn(`⚠️ Sound ${name} not found`);
      }
    } catch (error) {
      console.error(`❌ Error playing sound ${name}:`, error);
    }
  }

  async unloadAll() {
    try {
      for (const [name, sound] of this.sounds.entries()) {
        await sound.unloadAsync();
      }
      this.sounds.clear();
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  setVolume(level: 'low' | 'medium' | 'high') {
    switch (level) {
      case 'low':
        this.volume = 0.3;
        break;
      case 'medium':
        this.volume = 0.6;
        break;
      case 'high':
        this.volume = 1.0;
        break;
    }
    console.log(`🔊 Volume set to ${level} (${this.volume})`);
  }

  getVolume(): number {
    return this.volume;
  }
}

export const soundManager = new SoundManager();

