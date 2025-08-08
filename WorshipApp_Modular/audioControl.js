// audioControl.js

class AudioControl {
  constructor(audioElement) {
    this.audio = audioElement;
  }

  // Set the audio volume (0.0 to 1.0)
  setVolume(volume) {
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    this.audio.volume = volume;
  }

  // Get the current volume
  getVolume() {
    return this.audio.volume;
  }

  // Play the audio
  play() {
    this.audio.play();
  }

  // Pause the audio
  pause() {
    this.audio.pause();
  }

  // Stop the audio and reset to start
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // Load new audio source
  loadSource(src) {
    this.audio.src = src;
    this.audio.load();
  }

  // Check if audio is playing
  isPlaying() {
    return !this.audio.paused && !this.audio.ended;
  }
}

export default AudioControl;
