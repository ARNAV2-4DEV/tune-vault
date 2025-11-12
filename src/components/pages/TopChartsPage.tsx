import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Songs } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, TrendingUp, ArrowLeft, Search, Music } from 'lucide-react';

export default function TopChartsPage() {
  const [songs, setSongs] = useState<Songs[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Songs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Songs>('songs');
        
        // Filter only user-uploaded songs and sort by upload date (newest first)
        const userSongs = items
          .filter(song => song.uploadedBy) // Only show user-uploaded songs
          .sort((a, b) => {
            const dateA = new Date(b.uploadDate || b._createdDate || 0);
            const dateB = new Date(a.uploadDate || a._createdDate || 0);
            return dateA.getTime() - dateB.getTime();
          });
        
        setSongs(userSongs);
        setFilteredSongs(userSongs);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(song =>
        song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artistName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.albumName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading music...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-neon-teal/20 to-transparent">
        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <Link to="/" className="inline-flex items-center text-neon-teal hover:text-neon-teal/80 mb-6 font-paragraph">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <TrendingUp className="h-12 w-12 text-neon-teal" />
            <div>
              <h1 className="text-5xl font-bold text-neon-teal font-heading mb-2">All Music</h1>
              <p className="text-foreground/70 text-lg font-paragraph">
                Discover music uploaded by our community
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {songs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">No music available</h3>
            <p className="text-foreground/50 font-paragraph mb-6">
              No songs have been uploaded yet. Be the first to share your music!
            </p>
            <Link to="/upload">
              <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                Upload First Song
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Search and Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <Input
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-foreground font-paragraph"
                />
              </div>
              <div className="text-foreground/70 font-paragraph">
                {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} found
              </div>
            </div>

            {/* Songs List */}
            <div className="grid gap-4">
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        {/* Position Number */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-neon-teal text-black rounded-lg flex items-center justify-center font-bold text-lg font-paragraph">
                            {index + 1}
                          </div>
                        </div>

                        {/* Album Art */}
                        <div className="flex-shrink-0 relative">
                          <Image
                            src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                            alt={`${song.title} album art`}
                            className="w-16 h-16 object-cover rounded-lg"
                            width={64}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <Play className="h-6 w-6 text-neon-teal" />
                          </div>
                        </div>

                        {/* Song Info */}
                        <div className="flex-grow min-w-0">
                          <Link to={`/song/${song._id}`}>
                            <h3 className="text-xl font-semibold text-foreground hover:text-neon-teal transition-colors font-heading truncate">
                              {song.title}
                            </h3>
                          </Link>
                          <p className="text-foreground/70 font-paragraph truncate">
                            {song.artistName}
                          </p>
                          {song.albumName && (
                            <p className="text-foreground/50 text-sm font-paragraph truncate">
                              {song.albumName}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50 font-paragraph">
                            {song.genre && (
                              <Badge variant="outline" className="border-neon-teal/50 text-neon-teal">
                                {song.genre}
                              </Badge>
                            )}
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(song.duration)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Link to={`/song/${song._id}`}>
                            <Button size="sm" className="bg-neon-teal text-black hover:bg-neon-teal/90">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredSongs.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                  No songs found
                </h3>
                <p className="text-foreground/70 font-paragraph">
                  Try adjusting your search terms or browse all available music.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}