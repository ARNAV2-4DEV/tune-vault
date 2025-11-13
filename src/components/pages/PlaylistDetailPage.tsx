import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Playlists, Songs } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, ArrowLeft, Music, Globe, Lock, User, GripVertical, Pause, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useMusicPlayer } from '@/stores/musicPlayerStore';
import { useMember } from '@/integrations';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { member } = useMember();
  const [playlist, setPlaylist] = useState<Playlists | null>(null);
  const [songs, setSongs] = useState<Songs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const { 
    currentSong, 
    isPlaying, 
    playSong, 
    pauseSong, 
    resumeSong, 
    addToQueue 
  } = useMusicPlayer();

  useEffect(() => {
    const fetchPlaylistAndSongs = async () => {
      if (!id) {
        setError('Playlist ID not found');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch playlist details
        const playlistData = await BaseCrudService.getById<Playlists>('playlists', id);
        setPlaylist(playlistData);

        // Check if current user can edit this playlist
        const userCanEdit = member && (
          playlistData.uploadedBy === member.loginEmail || 
          playlistData.uploadedBy === (member as any)?._id ||
          playlistData.creator === member.loginEmail ||
          playlistData.creator === (member as any)?._id
        );
        setCanEdit(!!userCanEdit);

        // Fetch actual songs from playlist - only show user's uploaded songs
        if (playlistData.songs) {
          const songIds = playlistData.songs.split(',').filter(id => id.trim());
          if (songIds.length > 0) {
            const allSongs = await BaseCrudService.getAll<Songs>('songs');
            
            // Filter to only include songs uploaded by the current user
            const userUploadedSongs = allSongs.items.filter(song => 
              song.uploadedBy === member?.loginEmail || 
              song.uploadedBy === (member as any)?._id
            );
            
            const playlistSongs = songIds.map(songId => 
              userUploadedSongs.find(song => song._id === songId.trim())
            ).filter(Boolean) as Songs[];
            setSongs(playlistSongs);
          } else {
            setSongs([]);
          }
        } else {
          setSongs([]);
        }
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistAndSongs();
  }, [id, member]);

  const handlePlaySong = (song: Songs) => {
    if (currentSong?._id === song._id) {
      if (isPlaying) {
        pauseSong();
      } else {
        resumeSong();
      }
    } else {
      playSong(song, songs);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleAddToQueue = (song: Songs) => {
    addToQueue(song);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;
    
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    
    if (fromIndex === toIndex) return;

    // Reorder songs locally
    const newSongs = [...songs];
    const [movedSong] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, movedSong);
    setSongs(newSongs);

    // Update playlist in database
    try {
      const newSongIds = newSongs.map(song => song._id).join(',');
      await BaseCrudService.update('playlists', {
        _id: id!,
        songs: newSongIds
      });
      
      // Update local playlist state
      setPlaylist(prev => prev ? { ...prev, songs: newSongIds } : null);
    } catch (error) {
      console.error('Error updating playlist order:', error);
      // Revert local changes on error
      setSongs(songs);
    }
  };

  const handleRemoveFromPlaylist = async (songToRemove: Songs) => {
    if (!canEdit) return;
    
    try {
      const newSongs = songs.filter(song => song._id !== songToRemove._id);
      const newSongIds = newSongs.map(song => song._id).join(',');
      
      await BaseCrudService.update('playlists', {
        _id: id!,
        songs: newSongIds
      });
      
      setSongs(newSongs);
      setPlaylist(prev => prev ? { ...prev, songs: newSongIds } : null);
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-center">
          <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">Playlist not found</h3>
          <p className="text-foreground/50 font-paragraph mb-6">{error || 'The playlist you\'re looking for doesn\'t exist'}</p>
          <Link to="/playlists">
            <Button className="bg-neon-teal text-black hover:bg-neon-teal/90">
              Browse Playlists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = songs.reduce((total, song) => total + (song.duration || 0), 0);
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <Link to="/playlists" className="inline-flex items-center text-secondary hover:text-secondary/80 mb-8 font-paragraph">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playlists
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-8 items-start"
          >
            {/* Playlist Cover */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Image
                  src={playlist.coverImage || 'https://static.wixstatic.com/media/888b2d_2bfac6af736440b7902f9ae531d75067~mv2.png?originWidth=256&originHeight=256'}
                  alt={`${playlist.playlistName} cover`}
                  className="w-64 h-64 object-cover rounded-2xl shadow-2xl"
                  width={256}
                />
                <div className="absolute inset-0 bg-black/20 rounded-2xl" />
              </div>
            </div>

            {/* Playlist Info */}
            <div className="flex-grow space-y-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={playlist.isPublic ? "default" : "secondary"}
                  className={playlist.isPublic ? "bg-neon-teal text-black" : "bg-foreground/20 text-foreground"}
                >
                  {playlist.isPublic ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Public Playlist
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Private Playlist
                    </>
                  )}
                </Badge>
              </div>

              <h1 className="text-5xl font-bold text-secondary font-heading">
                {playlist.playlistName}
              </h1>
              
              {playlist.description && (
                <p className="text-foreground/80 text-lg font-paragraph max-w-2xl">
                  {playlist.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/70 font-paragraph">
                {playlist.creator && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {playlist.creator}
                  </div>
                )}
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  {songs.length} songs
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDuration(totalDuration)}
                  </div>
                )}
                {(playlist.creationDate || playlist._createdDate) && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(playlist.creationDate || playlist._createdDate!), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={handlePlayAll}
                  className="bg-secondary text-black hover:bg-secondary/90"
                  disabled={songs.length === 0}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Play All
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-secondary text-secondary hover:bg-secondary hover:text-black"
                  disabled={songs.length === 0}
                >
                  Shuffle
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Songs List */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">No songs in this playlist</h3>
            <p className="text-foreground/50 font-paragraph">Add some songs to get started!</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist-songs" isDropDisabled={!canEdit}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {songs.map((song, index) => (
                    <Draggable
                      key={song._id}
                      draggableId={song._id}
                      index={index}
                      isDragDisabled={!canEdit}
                    >
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          <Card className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group ${
                            snapshot.isDragging ? 'shadow-2xl bg-neon-teal/20' : ''
                          } ${
                            currentSong?._id === song._id ? 'bg-neon-teal/10 border-neon-teal/30' : ''
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Drag Handle */}
                                {canEdit && (
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                )}
                                
                                {/* Track Number / Play Button */}
                                <div className="flex-shrink-0 w-8 text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePlaySong(song)}
                                    className="w-8 h-8 p-0 hover:bg-neon-teal/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {currentSong?._id === song._id && isPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <span className={`text-foreground/50 font-paragraph group-hover:hidden ${
                                    currentSong?._id === song._id ? 'text-neon-teal' : ''
                                  }`}>
                                    {index + 1}
                                  </span>
                                </div>

                                {/* Album Art */}
                                <div className="flex-shrink-0">
                                  <Image
                                    src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                                    alt={`${song.title} album art`}
                                    className="w-12 h-12 object-cover rounded"
                                    width={48}
                                  />
                                </div>

                                {/* Song Info */}
                                <div className="flex-grow min-w-0">
                                  <h3 className={`font-semibold truncate font-heading ${
                                    currentSong?._id === song._id ? 'text-neon-teal' : 'text-foreground'
                                  }`}>
                                    {song.title}
                                  </h3>
                                  <p className="text-foreground/70 text-sm truncate font-paragraph">
                                    {song.artistName}
                                  </p>
                                </div>

                                {/* Album Name */}
                                {song.albumName && (
                                  <div className="hidden md:block min-w-0 flex-1">
                                    <p className="text-foreground/50 text-sm truncate font-paragraph">
                                      {song.albumName}
                                    </p>
                                  </div>
                                )}

                                {/* Duration */}
                                <div className="text-foreground/50 text-sm font-paragraph">
                                  {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddToQueue(song)}
                                    className="hover:bg-neon-teal/20"
                                    title="Add to Queue"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFromPlaylist(song)}
                                      className="hover:bg-red-500/20 text-red-400"
                                      title="Remove from Playlist"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}