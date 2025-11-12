import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs, Playlists } from '@/entities';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Music, TrendingUp, Clock, Upload, User, Disc } from 'lucide-react';

export default function HomePage() {
  const { member, isAuthenticated } = useMember();
  const [recentSongs, setRecentSongs] = useState<Songs[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlists[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsResponse, playlistsResponse] = await Promise.all([
          BaseCrudService.getAll<Songs>('songs'),
          BaseCrudService.getAll<Playlists>('playlists')
        ]);
        
        // Get recent user-uploaded songs (newest first)
        const userSongs = songsResponse.items
          .filter(song => song.uploadedBy) // Only show user-uploaded songs
          .sort((a, b) => {
            const dateA = new Date(b.uploadDate || b._createdDate || 0);
            const dateB = new Date(a.uploadDate || a._createdDate || 0);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 8);
        
        // Filter public playlists and take top 6
        const publicPlaylists = playlistsResponse.items
          .filter(playlist => playlist.isPublic)
          .slice(0, 6);
        
        setRecentSongs(userSongs);
        setFeaturedPlaylists(publicPlaylists);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  };

  const title = "Stream Your Sound";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Hero Section - The Kinetic Typewriter */}
      <section className="h-screen flex items-center justify-center bg-deep-space-blue relative overflow-hidden">
        <div className="text-center z-10">
          <motion.h1 
            className="text-7xl font-bold text-neon-teal font-heading mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {title.split('').map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block"
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
            <motion.span
              className="inline-block w-1 h-10 bg-neon-teal ml-1"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.h1>
          
          <motion.p 
            className="text-xl text-foreground/80 mb-12 font-paragraph max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            Upload, discover, and share your music in a futuristic sound lab
          </motion.p>
          
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            {isAuthenticated ? (
              <>
                <Link to="/upload">
                  <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Music
                  </Button>
                </Link>
                <Link to="/upload-album">
                  <Button variant="outline" className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black font-paragraph">
                    <Disc className="mr-2 h-4 w-4" />
                    Upload Album
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/playlists">
                  <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                    <Music className="mr-2 h-4 w-4" />
                    Browse Music
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black font-paragraph"
                  onClick={() => window.location.href = '/upload'}
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In to Upload
                </Button>
              </>
            )}
          </motion.div>
        </div>
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-neon-teal/20" />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Songs Section - Only show if there are user-uploaded songs */}
      {recentSongs.length > 0 && (
        <section className="py-24 px-8">
          <div className="max-w-[120rem] mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-neon-teal font-heading mb-4">Recent Uploads</h2>
                <p className="text-foreground/70 font-paragraph">Latest music from our community</p>
              </div>
              {isAuthenticated && (
                <Link to="/my-music">
                  <Button variant="outline" className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black">
                    View My Music
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentSongs.map((song) => (
                <Link key={song._id} to={`/song/${song._id}`}>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="relative mb-4">
                        <Image
                          src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                          alt={`${song.title} album art`}
                          className="w-full aspect-square object-cover rounded-lg"
                          width={200}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <Play className="h-12 w-12 text-neon-teal" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 truncate font-heading">
                        {song.title}
                      </h3>
                      <p className="text-foreground/70 text-sm truncate font-paragraph">
                        {song.artistName}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-foreground/50 font-paragraph">
                        <Clock className="h-3 w-3 mr-1" />
                        {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State for No Songs */}
      {recentSongs.length === 0 && (
        <section className="py-24 px-8">
          <div className="max-w-[120rem] mx-auto text-center">
            <Music className="h-16 w-16 text-neon-teal/50 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neon-teal font-heading mb-4">No Music Yet</h2>
            <p className="text-foreground/70 font-paragraph mb-8 max-w-md mx-auto">
              Be the first to upload music to our platform! Share your creativity with the world.
            </p>
            {isAuthenticated ? (
              <div className="flex space-x-4 justify-center">
                <Link to="/upload">
                  <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Song
                  </Button>
                </Link>
                <Link to="/upload-album">
                  <Button variant="outline" className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black font-paragraph">
                    <Disc className="mr-2 h-4 w-4" />
                    Upload Album
                  </Button>
                </Link>
              </div>
            ) : (
              <Button 
                className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph"
                onClick={() => window.location.href = '/upload'}
              >
                <User className="mr-2 h-4 w-4" />
                Sign In to Upload
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Featured Playlists Section */}
      {featuredPlaylists.length > 0 && (
        <section className="py-24 px-8 bg-white/5">
          <div className="max-w-[120rem] mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-secondary font-heading mb-4">Featured Playlists</h2>
                <p className="text-foreground/70 font-paragraph">Curated collections for every mood</p>
              </div>
              <Link to="/playlists">
                <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black">
                  Browse All
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPlaylists.map((playlist) => (
                <Link key={playlist._id} to={`/playlist/${playlist._id}`}>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="relative mb-6">
                        <Image
                          src={playlist.coverImage || 'https://static.wixstatic.com/media/888b2d_029d8cd26c40416586ec0edd196f74c7~mv2.png?originWidth=256&originHeight=256'}
                          alt={`${playlist.playlistName} cover`}
                          className="w-full aspect-square object-cover rounded-lg"
                          width={300}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <Play className="h-16 w-16 text-secondary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                        {playlist.playlistName}
                      </h3>
                      <p className="text-foreground/70 text-sm mb-3 font-paragraph line-clamp-2">
                        {playlist.description}
                      </p>
                      <p className="text-secondary text-sm font-paragraph">
                        By {playlist.creator}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}