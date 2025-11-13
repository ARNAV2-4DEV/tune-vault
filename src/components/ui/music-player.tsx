import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/stores/musicPlayerStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle,
  List,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    originalPlaylist,
    repeat,
    shuffle,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setRepeat,
    shuffleQueue,
    removeFromQueue,
    reorderQueue,
    isPlayingFromQueue,
    getCurrentPlaylist,
    getCurrentIndex
  } = useMusicPlayer();

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextSong();
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play, isPlaying:', isPlaying);
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error in canplay handler:', error);
        });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying, repeat, nextSong, setCurrentTime, setDuration]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      console.log('Attempting to play audio:', currentSong?.title);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        console.error('Audio source:', audio.src);
        console.error('Audio readyState:', audio.readyState);
        console.error('Audio networkState:', audio.networkState);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // Handle song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioFile) return;

    console.log('Loading audio file:', currentSong.audioFile);
    audio.src = currentSong.audioFile;
    audio.load();
    
    // Add error handling for audio loading
    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      console.error('Failed to load audio file:', currentSong.audioFile);
      
      // If it's a blob URL that might have been revoked, try to handle gracefully
      if (currentSong.audioFile?.startsWith('blob:')) {
        console.warn('Blob URL may have been revoked. Audio file might not be available.');
        // You could implement fallback logic here, such as:
        // - Show an error message to the user
        // - Skip to the next song
        // - Prompt user to re-upload the file
      }
    };
    
    const handleCanPlayThrough = () => {
      console.log('Audio can play through:', currentSong.audioFile);
    };
    
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [currentSong]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seekTo(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleRepeatToggle = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    
    reorderQueue(fromIndex, toIndex);
  };

  if (!currentSong) {
    return null;
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-deep-space-blue/95 backdrop-blur-md border-t border-white/10"
      >
        <Card className="bg-transparent border-0 rounded-none">
          <CardContent className="p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/50 mt-1 font-paragraph">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              {/* Song Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Image
                  src={currentSong.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                  alt={`${currentSong.title} album art`}
                  className="w-12 h-12 rounded object-cover"
                  width={48}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate font-heading text-sm">
                    {currentSong.title}
                  </h4>
                  <p className="text-foreground/70 text-xs truncate font-paragraph">
                    {currentSong.artistName}
                  </p>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shuffleQueue}
                  className={`hover:bg-white/10 ${shuffle ? 'text-neon-teal' : 'text-foreground/70'}`}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousSong}
                  className="hover:bg-white/10 text-foreground"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={isPlaying ? pauseSong : resumeSong}
                  className="bg-neon-teal text-black hover:bg-neon-teal/90 w-10 h-10 rounded-full"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextSong}
                  className="hover:bg-white/10 text-foreground"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepeatToggle}
                  className={`hover:bg-white/10 ${repeat !== 'none' ? 'text-neon-teal' : 'text-foreground/70'}`}
                >
                  <Repeat className="h-4 w-4" />
                  {repeat === 'one' && (
                    <span className="absolute -top-1 -right-1 text-xs">1</span>
                  )}
                </Button>
              </div>

              {/* Volume & Queue */}
              <div className="flex items-center space-x-3 flex-1 justify-end">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="hover:bg-white/10 text-foreground/70"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="w-20">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQueue(!showQueue)}
                  className="hover:bg-white/10 text-foreground/70"
                >
                  <List className="h-4 w-4" />
                  {(queue.length > 0 || originalPlaylist.length > 0) && (
                    <span className="ml-1 text-xs">
                      {queue.length > 0 ? queue.length : originalPlaylist.length}
                    </span>
                  )}
                  {showQueue ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Panel */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 bg-deep-space-blue/98 max-h-80 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground font-heading">
                    {isPlayingFromQueue() ? 'Queue' : 'Now Playing'} ({getCurrentPlaylist().length} songs)
                  </h3>
                  {queue.length > 0 && (
                    <div className="text-xs text-foreground/50 font-paragraph">
                      Queue: {queue.length} songs
                    </div>
                  )}
                </div>
                
                {/* Show Queue if it has songs */}
                {queue.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neon-teal mb-2 font-heading">Up Next (Queue)</h4>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="queue">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {queue.map((song, index) => (
                              <Draggable
                                key={`${song._id}-${index}`}
                                draggableId={`${song._id}-${index}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center space-x-3 p-2 rounded transition-colors group ${
                                      snapshot.isDragging 
                                        ? 'bg-neon-teal/20 shadow-lg' 
                                        : 'hover:bg-white/5'
                                    } ${
                                      isPlayingFromQueue() && index === getCurrentIndex() ? 'bg-neon-teal/10 border border-neon-teal/30' : ''
                                    }`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground/80"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    
                                    <div className="w-6 text-center">
                                      <span className={`text-xs font-paragraph ${
                                        isPlayingFromQueue() && index === getCurrentIndex() ? 'text-neon-teal' : 'text-foreground/50'
                                      }`}>
                                        {index + 1}
                                      </span>
                                    </div>
                                    
                                    <Image
                                      src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                                      alt={`${song.title} album art`}
                                      className="w-8 h-8 rounded object-cover"
                                      width={32}
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm truncate font-heading ${
                                        isPlayingFromQueue() && index === getCurrentIndex() ? 'text-neon-teal' : 'text-foreground'
                                      }`}>
                                        {song.title}
                                      </p>
                                      <p className="text-xs text-foreground/70 truncate font-paragraph">
                                        {song.artistName}
                                      </p>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromQueue(index)}
                                      className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
                
                {/* Show Original Playlist if available */}
                {originalPlaylist.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground/70 mb-2 font-heading">
                      {queue.length > 0 ? 'Original Playlist (will resume after queue)' : 'Current Playlist'}
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {originalPlaylist.map((song, index) => (
                        <div
                          key={`playlist-${song._id}-${index}`}
                          className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                            !isPlayingFromQueue() && index === getCurrentIndex() ? 'bg-neon-teal/10 border border-neon-teal/30' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="w-6 text-center">
                            <span className={`text-xs font-paragraph ${
                              !isPlayingFromQueue() && index === getCurrentIndex() ? 'text-neon-teal' : 'text-foreground/50'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          
                          <Image
                            src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                            alt={`${song.title} album art`}
                            className="w-8 h-8 rounded object-cover"
                            width={32}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate font-heading ${
                              !isPlayingFromQueue() && index === getCurrentIndex() ? 'text-neon-teal' : 'text-foreground'
                            }`}>
                              {song.title}
                            </p>
                            <p className="text-xs text-foreground/70 truncate font-paragraph">
                              {song.artistName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}