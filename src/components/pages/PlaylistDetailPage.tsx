import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Playlists, Songs } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, ArrowLeft, Music, Globe, Lock, User } from 'lucide-react';
import { format } from 'date-fns';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlists | null>(null);
  const [songs, setSongs] = useState<Songs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // For demo purposes, fetch some random songs since we don't have playlist-song relationships
        const songsResponse = await BaseCrudService.getAll<Songs>('songs');
        // Simulate playlist songs by taking a random subset
        const shuffledSongs = songsResponse.items.sort(() => 0.5 - Math.random()).slice(0, 8);
        setSongs(shuffledSongs);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistAndSongs();
  }, [id]);

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
                <Button size="lg" className="bg-secondary text-black hover:bg-secondary/90">
                  <Play className="h-5 w-5 mr-2" />
                  Play All
                </Button>
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black">
                  Shuffle
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Songs List */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="space-y-2">
          {songs.map((song, index) => (
            <motion.div
              key={song._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Track Number */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-foreground/50 font-paragraph group-hover:hidden">
                        {index + 1}
                      </span>
                      <Play className="h-4 w-4 text-secondary hidden group-hover:block mx-auto" />
                    </div>

                    {/* Album Art */}
                    <div className="flex-shrink-0">
                      <Image
                        src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_a541d976e1a44d42bef79181bb055e72~mv2.png?originWidth=128&originHeight=128'}
                        alt={`${song.title} album art`}
                        className="w-12 h-12 object-cover rounded"
                        width={48}
                      />
                    </div>

                    {/* Song Info */}
                    <div className="flex-grow min-w-0">
                      <Link to={`/song/${song._id}`}>
                        <h4 className="font-semibold text-foreground hover:text-secondary transition-colors font-heading truncate">
                          {song.title}
                        </h4>
                      </Link>
                      <p className="text-foreground/70 text-sm font-paragraph truncate">
                        {song.artistName}
                      </p>
                    </div>

                    {/* Album */}
                    <div className="hidden md:block flex-grow min-w-0">
                      <p className="text-foreground/70 text-sm font-paragraph truncate">
                        {song.albumName}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="flex-shrink-0 text-foreground/50 text-sm font-paragraph">
                      {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">No songs in this playlist</h3>
            <p className="text-foreground/50 font-paragraph">Add some tracks to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}