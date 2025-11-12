import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs } from '@/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';
import { Music, Search, Upload, Play, Clock, Calendar, Trash2, Disc } from 'lucide-react';
import { format } from 'date-fns';

export default function MyMusicPage() {
  const { member } = useMember();
  const [songs, setSongs] = useState<Songs[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Songs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMySongs = async () => {
      if (!member?.loginEmail && !(member as any)?._id) return;
      
      try {
        const { items } = await BaseCrudService.getAll<Songs>('songs');
        
        // Filter songs uploaded by current user
        const userSongs = items.filter(song => 
          song.uploadedBy === member.loginEmail || 
          song.uploadedBy === (member as any)._id
        );
        
        // Sort by upload date (newest first)
        const sortedSongs = userSongs.sort((a, b) => {
          const dateA = new Date(a.uploadDate || a._createdDate || 0);
          const dateB = new Date(b.uploadDate || b._createdDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setSongs(sortedSongs);
        setFilteredSongs(sortedSongs);
      } catch (error) {
        console.error('Error fetching user songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMySongs();
  }, [member]);

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

  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      await BaseCrudService.delete('songs', songId);
      setSongs(prev => prev.filter(song => song._id !== songId));
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading your music...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground py-12">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-neon-teal font-heading mb-2">My Music</h1>
            <p className="text-foreground/70 font-paragraph">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'} uploaded
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to="/upload">
              <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                <Upload className="h-4 w-4 mr-2" />
                Upload Song
              </Button>
            </Link>
            <Link to="/upload-album">
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black font-paragraph">
                <Disc className="h-4 w-4 mr-2" />
                Upload Album
              </Button>
            </Link>
          </div>
        </div>

        {songs.length === 0 ? (
          /* Empty State */
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <Music className="h-16 w-16 text-neon-teal/50 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-foreground mb-4 font-heading">
                No songs uploaded yet
              </h3>
              <p className="text-foreground/70 mb-8 font-paragraph max-w-md mx-auto">
                Start building your music library by uploading your first song or album. 
                Share your creativity with the world!
              </p>
              <div className="flex space-x-4 justify-center">
                <Link to="/upload">
                  <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Song
                  </Button>
                </Link>
                <Link to="/upload-album">
                  <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black font-paragraph">
                    <Disc className="h-4 w-4 mr-2" />
                    Upload Album
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <Input
                  placeholder="Search your music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-foreground font-paragraph"
                />
              </div>
            </div>

            {/* Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song) => (
                <Card key={song._id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <Image
                        src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                        alt={`${song.title} album art`}
                        className="w-full aspect-square object-cover rounded-lg"
                        width={200}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <Link to={`/song/${song._id}`}>
                          <Button size="sm" className="bg-neon-teal text-black hover:bg-neon-teal/90">
                            <Play className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={() => handleDeleteSong(song._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground truncate font-heading">
                        {song.title}
                      </h3>
                      <p className="text-foreground/70 text-sm truncate font-paragraph">
                        {song.artistName}
                      </p>
                      
                      {song.albumName && (
                        <p className="text-foreground/50 text-xs truncate font-paragraph">
                          {song.albumName}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-foreground/50 font-paragraph">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(song.duration)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(song.uploadDate || song._createdDate)}
                        </div>
                      </div>
                      
                      {song.genre && (
                        <Badge variant="outline" className="text-xs border-neon-teal/50 text-neon-teal">
                          {song.genre}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSongs.length === 0 && searchQuery && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                    No songs found
                  </h3>
                  <p className="text-foreground/70 font-paragraph">
                    Try adjusting your search terms or upload a new song.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}