import { create } from 'zustand';
import { Songs } from '@/entities';

interface MusicPlayerState {
  // Current playback state
  currentSong: Songs | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  
  // Queue management (priority queue - plays first)
  queue: Songs[];
  queueIndex: number; // Current position in queue
  
  // Original playlist management (plays after queue is empty)
  originalPlaylist: Songs[];
  originalPlaylistIndex: number; // Current position in original playlist
  
  // Player settings
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  
  // Shuffle state tracking
  isQueueShuffled: boolean;
  isPlaylistShuffled: boolean;
  unshuffledQueue: Songs[];
  unshuffledPlaylist: Songs[];
  
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
  toggleShuffle: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setRepeat: (mode: 'none' | 'one' | 'all') => void;
  
  // Player state updates
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  
  // Helper getters
  isPlayingFromQueue: () => boolean;
  getCurrentPlaylist: () => Songs[];
  getCurrentIndex: () => number;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  // ... keep existing code (initial state and all methods)
  // Initial state
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [], // Priority queue - starts empty
  queueIndex: -1,
  originalPlaylist: [],
  originalPlaylistIndex: -1,
  shuffle: false,
  repeat: 'none',
  
  // Shuffle state tracking
  isQueueShuffled: false,
  isPlaylistShuffled: false,
  unshuffledQueue: [],
  unshuffledPlaylist: [],

  // Helper getters
  isPlayingFromQueue: () => {
    const state = get();
    return state.queue.length > 0 && state.queueIndex >= 0 && state.queueIndex < state.queue.length;
  },

  getCurrentPlaylist: () => {
    const state = get();
    return state.isPlayingFromQueue() ? state.queue : state.originalPlaylist;
  },

  getCurrentIndex: () => {
    const state = get();
    return state.isPlayingFromQueue() ? state.queueIndex : state.originalPlaylistIndex;
  },

  // ... keep existing code (all player actions and methods)
  // Player actions
  playSong: (song: Songs, playlist?: Songs[]) => {
    const state = get();
    
    if (playlist) {
      // Playing from a playlist - set as original playlist
      const songIndex = playlist.findIndex(s => s._id === song._id);
      set({
        currentSong: song,
        originalPlaylist: playlist,
        originalPlaylistIndex: songIndex,
        isPlaying: true,
        currentTime: 0,
        // Don't clear queue - it should persist
      });
    } else {
      // Playing a single song
      // Check if song is in queue first
      const queueIndex = state.queue.findIndex(s => s._id === song._id);
      if (queueIndex >= 0) {
        // Song is in queue, play from queue
        set({
          currentSong: song,
          queueIndex: queueIndex,
          isPlaying: true,
          currentTime: 0
        });
      } else {
        // Check if song is in original playlist
        const playlistIndex = state.originalPlaylist.findIndex(s => s._id === song._id);
        if (playlistIndex >= 0) {
          // Song is in original playlist, play from there
          set({
            currentSong: song,
            originalPlaylistIndex: playlistIndex,
            isPlaying: true,
            currentTime: 0
          });
        } else {
          // Song not in any playlist, create a new single-song playlist
          set({
            currentSong: song,
            originalPlaylist: [song],
            originalPlaylistIndex: 0,
            isPlaying: true,
            currentTime: 0
          });
        }
      }
    }
  },

  pauseSong: () => set({ isPlaying: false }),
  
  resumeSong: () => set({ isPlaying: true }),

  nextSong: () => {
    const state = get();
    
    if (state.repeat === 'one') {
      // Stay on current song
      set({ currentTime: 0, isPlaying: true });
      return;
    }

    // Priority 1: If there are songs in queue, play them first
    if (state.queue.length > 0) {
      if (state.isPlayingFromQueue()) {
        // Currently playing from queue, move to next song in queue
        const nextQueueIndex = state.queueIndex + 1;
        
        if (nextQueueIndex < state.queue.length) {
          // Play next song in queue
          set({
            currentSong: state.queue[nextQueueIndex],
            queueIndex: nextQueueIndex,
            currentTime: 0,
            isPlaying: true
          });
        } else {
          // Queue finished, switch to original playlist
          if (state.originalPlaylist.length > 0) {
            // Resume from next song in original playlist after where we were
            let resumeIndex = state.originalPlaylistIndex + 1;
            
            // If we're at the end and repeat is 'all', start from beginning
            if (resumeIndex >= state.originalPlaylist.length && state.repeat === 'all') {
              resumeIndex = 0;
            }
            
            if (resumeIndex < state.originalPlaylist.length) {
              set({
                currentSong: state.originalPlaylist[resumeIndex],
                originalPlaylistIndex: resumeIndex,
                queueIndex: -1, // No longer playing from queue
                currentTime: 0,
                isPlaying: true
              });
            } else {
              // End of playlist
              set({ isPlaying: false });
            }
          } else {
            // No original playlist, stop playing
            set({ isPlaying: false });
          }
        }
      } else {
        // Currently playing from original playlist, but queue has songs
        // Switch to queue and start from the beginning
        set({
          currentSong: state.queue[0],
          queueIndex: 0,
          currentTime: 0,
          isPlaying: true
        });
      }
    } else {
      // No queue, playing from original playlist
      const nextPlaylistIndex = state.originalPlaylistIndex + 1;
      
      if (nextPlaylistIndex < state.originalPlaylist.length) {
        // Play next song in original playlist
        set({
          currentSong: state.originalPlaylist[nextPlaylistIndex],
          originalPlaylistIndex: nextPlaylistIndex,
          currentTime: 0,
          isPlaying: true
        });
      } else if (state.repeat === 'all') {
        // Repeat playlist from beginning
        set({
          currentSong: state.originalPlaylist[0],
          originalPlaylistIndex: 0,
          currentTime: 0,
          isPlaying: true
        });
      } else {
        // End of playlist
        set({ isPlaying: false });
      }
    }
  },

  previousSong: () => {
    const state = get();
    
    // If we're more than 3 seconds into the song, restart it
    if (state.currentTime > 3) {
      set({ currentTime: 0, isPlaying: true });
      return;
    }
    
    // Check if we're playing from queue
    if (state.isPlayingFromQueue()) {
      const prevQueueIndex = state.queueIndex - 1;
      
      if (prevQueueIndex >= 0) {
        // Play previous song in queue
        set({
          currentSong: state.queue[prevQueueIndex],
          queueIndex: prevQueueIndex,
          currentTime: 0,
          isPlaying: true
        });
      } else {
        // At beginning of queue, restart current song
        set({ currentTime: 0, isPlaying: true });
      }
    } else {
      // Playing from original playlist
      const prevPlaylistIndex = state.originalPlaylistIndex - 1;
      
      if (prevPlaylistIndex >= 0) {
        // Play previous song in original playlist
        set({
          currentSong: state.originalPlaylist[prevPlaylistIndex],
          originalPlaylistIndex: prevPlaylistIndex,
          currentTime: 0,
          isPlaying: true
        });
      } else if (state.repeat === 'all') {
        // Go to last song in playlist
        const lastIndex = state.originalPlaylist.length - 1;
        set({
          currentSong: state.originalPlaylist[lastIndex],
          originalPlaylistIndex: lastIndex,
          currentTime: 0,
          isPlaying: true
        });
      } else {
        // At beginning of playlist, restart current song
        set({ currentTime: 0, isPlaying: true });
      }
    }
  },

  seekTo: (time: number) => set({ currentTime: time }),
  
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  // Queue actions
  addToQueue: (song: Songs) => {
    const state = get();
    const existingIndex = state.queue.findIndex(s => s._id === song._id);
    
    if (existingIndex === -1) {
      // Add song to end of queue
      const newQueue = [...state.queue, song];
      
      // If no song is currently playing, start playing the first song in queue
      if (!state.currentSong) {
        set({
          queue: newQueue,
          currentSong: song,
          queueIndex: newQueue.length - 1,
          isPlaying: true,
          currentTime: 0
        });
      } else {
        // If currently playing from original playlist and queue was empty, 
        // the queue will be played after current song finishes
        set({ queue: newQueue });
      }
    }
  },

  removeFromQueue: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.queue.length) return;
    
    const newQueue = state.queue.filter((_, i) => i !== index);
    let newQueueIndex = state.queueIndex;
    
    if (index < state.queueIndex) {
      // Removed song was before current, adjust index
      newQueueIndex = state.queueIndex - 1;
    } else if (index === state.queueIndex) {
      // Removing currently playing song from queue
      if (newQueue.length === 0) {
        // Queue is now empty, switch to original playlist if available
        if (state.originalPlaylist.length > 0) {
          const resumeIndex = Math.max(0, state.originalPlaylistIndex);
          set({
            queue: newQueue,
            queueIndex: -1,
            currentSong: state.originalPlaylist[resumeIndex],
            originalPlaylistIndex: resumeIndex,
            currentTime: 0
          });
        } else {
          // No original playlist, stop playing
          set({
            queue: newQueue,
            queueIndex: -1,
            currentSong: null,
            isPlaying: false,
            currentTime: 0
          });
        }
        return;
      } else {
        // Play next song in queue, or first if was last
        newQueueIndex = Math.min(state.queueIndex, newQueue.length - 1);
        set({
          queue: newQueue,
          queueIndex: newQueueIndex,
          currentSong: newQueue[newQueueIndex],
          currentTime: 0
        });
        return;
      }
    }
    
    set({
      queue: newQueue,
      queueIndex: newQueueIndex
    });
  },

  clearQueue: () => {
    const state = get();
    
    if (state.isPlayingFromQueue()) {
      // Currently playing from queue, switch to original playlist
      if (state.originalPlaylist.length > 0) {
        const resumeIndex = Math.max(0, state.originalPlaylistIndex);
        set({
          queue: [],
          queueIndex: -1,
          currentSong: state.originalPlaylist[resumeIndex],
          originalPlaylistIndex: resumeIndex,
          currentTime: 0
        });
      } else {
        // No original playlist, stop playing
        set({
          queue: [],
          queueIndex: -1,
          currentSong: null,
          isPlaying: false,
          currentTime: 0
        });
      }
    } else {
      // Not playing from queue, just clear it
      set({
        queue: [],
        queueIndex: -1
      });
    }
  },

  toggleShuffle: () => {
    const state = get();
    
    if (state.shuffle) {
      // Turn off shuffle - restore original order
      if (state.isPlayingFromQueue() && state.isQueueShuffled) {
        // Restore queue order
        const currentSong = state.currentSong;
        const currentSongIndex = state.unshuffledQueue.findIndex(song => song._id === currentSong?._id);
        
        set({
          queue: [...state.unshuffledQueue],
          queueIndex: currentSongIndex >= 0 ? currentSongIndex : 0,
          isQueueShuffled: false,
          shuffle: false
        });
      } else if (!state.isPlayingFromQueue() && state.isPlaylistShuffled) {
        // Restore playlist order
        const currentSong = state.currentSong;
        const currentSongIndex = state.unshuffledPlaylist.findIndex(song => song._id === currentSong?._id);
        
        set({
          originalPlaylist: [...state.unshuffledPlaylist],
          originalPlaylistIndex: currentSongIndex >= 0 ? currentSongIndex : 0,
          isPlaylistShuffled: false,
          shuffle: false
        });
      } else {
        // Just turn off shuffle flag
        set({ shuffle: false });
      }
    } else {
      // Turn on shuffle
      if (state.isPlayingFromQueue() && state.queue.length > 1) {
        // Shuffle queue
        const currentSong = state.currentSong;
        const unshuffledQueue = [...state.queue];
        const otherSongs = state.queue.filter(song => song._id !== currentSong?._id);
        
        // Fisher-Yates shuffle for remaining songs
        for (let i = otherSongs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
        }
        
        // Put current song at the beginning
        const shuffledQueue = currentSong ? [currentSong, ...otherSongs] : otherSongs;
        
        set({
          queue: shuffledQueue,
          queueIndex: currentSong ? 0 : -1,
          unshuffledQueue: unshuffledQueue,
          isQueueShuffled: true,
          shuffle: true
        });
      } else if (!state.isPlayingFromQueue() && state.originalPlaylist.length > 1) {
        // Shuffle playlist
        const currentSong = state.currentSong;
        const unshuffledPlaylist = [...state.originalPlaylist];
        const otherSongs = state.originalPlaylist.filter(song => song._id !== currentSong?._id);
        
        // Fisher-Yates shuffle for remaining songs
        for (let i = otherSongs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
        }
        
        // Put current song at the beginning
        const shuffledPlaylist = currentSong ? [currentSong, ...otherSongs] : otherSongs;
        
        set({
          originalPlaylist: shuffledPlaylist,
          originalPlaylistIndex: currentSong ? 0 : -1,
          unshuffledPlaylist: unshuffledPlaylist,
          isPlaylistShuffled: true,
          shuffle: true
        });
      } else {
        // Just turn on shuffle flag
        set({ shuffle: true });
      }
    }
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    const state = get();
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= state.queue.length || toIndex >= state.queue.length) {
      return;
    }

    const newQueue = [...state.queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);

    let newQueueIndex = state.queueIndex;
    
    // Update current index based on the move
    if (fromIndex === state.queueIndex) {
      // The current song was moved
      newQueueIndex = toIndex;
    } else if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) {
      // Song moved from before current to after current
      newQueueIndex = state.queueIndex - 1;
    } else if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) {
      // Song moved from after current to before current
      newQueueIndex = state.queueIndex + 1;
    }

    set({
      queue: newQueue,
      queueIndex: newQueueIndex
    });
  },

  setRepeat: (mode: 'none' | 'one' | 'all') => set({ repeat: mode }),

  // Player state updates
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing })
}));