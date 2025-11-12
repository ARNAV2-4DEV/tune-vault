import { create } from 'zustand';
import { Songs } from '@/entities';

interface MusicPlayerState {
  // Current playback state
  currentSong: Songs | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  
  // Queue management
  queue: Songs[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  
  // Player actions
  playSong: (song: Songs, playlist?: Songs[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Queue actions
  addToQueue: (song: Songs) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  setRepeat: (mode: 'none' | 'one' | 'all') => void;
  
  // Player state updates
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  // Initial state
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 'none',

  // Player actions
  playSong: (song: Songs, playlist?: Songs[]) => {
    const state = get();
    
    if (playlist) {
      // If a playlist is provided, set it as the queue
      const songIndex = playlist.findIndex(s => s._id === song._id);
      set({
        currentSong: song,
        queue: playlist,
        currentIndex: songIndex,
        isPlaying: true,
        currentTime: 0
      });
    } else if (state.currentSong?._id === song._id) {
      // If same song, just toggle play/pause
      set({ isPlaying: !state.isPlaying });
    } else {
      // New song, add to queue if not already there
      const existingIndex = state.queue.findIndex(s => s._id === song._id);
      if (existingIndex >= 0) {
        set({
          currentSong: song,
          currentIndex: existingIndex,
          isPlaying: true,
          currentTime: 0
        });
      } else {
        set({
          currentSong: song,
          queue: [...state.queue, song],
          currentIndex: state.queue.length,
          isPlaying: true,
          currentTime: 0
        });
      }
    }
  },

  pauseSong: () => set({ isPlaying: false }),
  
  resumeSong: () => set({ isPlaying: true }),

  nextSong: () => {
    const state = get();
    if (state.queue.length === 0) return;

    let nextIndex = state.currentIndex + 1;
    
    if (state.repeat === 'one') {
      // Stay on current song
      nextIndex = state.currentIndex;
    } else if (nextIndex >= state.queue.length) {
      if (state.repeat === 'all') {
        nextIndex = 0;
      } else {
        // End of queue
        set({ isPlaying: false });
        return;
      }
    }

    set({
      currentSong: state.queue[nextIndex],
      currentIndex: nextIndex,
      currentTime: 0,
      isPlaying: true
    });
  },

  previousSong: () => {
    const state = get();
    if (state.queue.length === 0) return;

    let prevIndex = state.currentIndex - 1;
    
    if (prevIndex < 0) {
      if (state.repeat === 'all') {
        prevIndex = state.queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    set({
      currentSong: state.queue[prevIndex],
      currentIndex: prevIndex,
      currentTime: 0,
      isPlaying: true
    });
  },

  seekTo: (time: number) => set({ currentTime: time }),
  
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  // Queue actions
  addToQueue: (song: Songs) => {
    const state = get();
    const existingIndex = state.queue.findIndex(s => s._id === song._id);
    
    if (existingIndex === -1) {
      set({ queue: [...state.queue, song] });
    }
  },

  removeFromQueue: (index: number) => {
    const state = get();
    const newQueue = state.queue.filter((_, i) => i !== index);
    let newCurrentIndex = state.currentIndex;
    
    if (index < state.currentIndex) {
      newCurrentIndex = state.currentIndex - 1;
    } else if (index === state.currentIndex) {
      // Removing current song
      if (newQueue.length === 0) {
        set({
          queue: [],
          currentSong: null,
          currentIndex: -1,
          isPlaying: false
        });
        return;
      } else {
        // Play next song or first if was last
        newCurrentIndex = Math.min(state.currentIndex, newQueue.length - 1);
        set({
          queue: newQueue,
          currentSong: newQueue[newCurrentIndex],
          currentIndex: newCurrentIndex,
          currentTime: 0
        });
        return;
      }
    }
    
    set({
      queue: newQueue,
      currentIndex: newCurrentIndex
    });
  },

  clearQueue: () => set({
    queue: [],
    currentSong: null,
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0
  }),

  shuffleQueue: () => {
    const state = get();
    if (state.queue.length <= 1) return;

    const currentSong = state.currentSong;
    const otherSongs = state.queue.filter(song => song._id !== currentSong?._id);
    
    // Fisher-Yates shuffle
    for (let i = otherSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
    }

    const newQueue = currentSong ? [currentSong, ...otherSongs] : otherSongs;
    
    set({
      queue: newQueue,
      currentIndex: currentSong ? 0 : -1,
      shuffle: !state.shuffle
    });
  },

  setRepeat: (mode: 'none' | 'one' | 'all') => set({ repeat: mode }),

  // Player state updates
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing })
}));