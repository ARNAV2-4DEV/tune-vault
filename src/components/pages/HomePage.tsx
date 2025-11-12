import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { TopCharts, Playlists } from '@/entities';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Music, TrendingUp, Clock } from 'lucide-react';

export default function HomePage() {
  const [topCharts, setTopCharts] = useState<TopCharts[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlists[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chartsResponse, playlistsResponse] = await Promise.all([
          BaseCrudService.getAll<TopCharts>('topcharts'),
          BaseCrudService.getAll<Playlists>('playlists')
        ]);
        
        // Sort charts by position and take top 10
        const sortedCharts = chartsResponse.items
          .sort((a, b) => (a.chartPosition || 0) - (b.chartPosition || 0))
          .slice(0, 10);
        
        // Filter public playlists and take top 6
        const publicPlaylists = playlistsResponse.items
          .filter(playlist => playlist.isPublic)
          .slice(0, 6);
        
        setTopCharts(sortedCharts);
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
            Discover, stream, and organize your music in a futuristic sound lab
          </motion.p>
          
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <Link to="/top-charts">
              <Button className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph">
                <TrendingUp className="mr-2 h-4 w-4" />
                Explore Top Charts
              </Button>
            </Link>
            <Link to="/playlists">
              <Button variant="outline" className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black font-paragraph">
                <Music className="mr-2 h-4 w-4" />
                Browse Playlists
              </Button>
            </Link>
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

      {/* Top Charts Section */}
      <section className="py-24 px-8">
        <div className="max-w-[120rem] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-neon-teal font-heading mb-4">Top Charts</h2>
              <p className="text-foreground/70 font-paragraph">Trending tracks across all genres</p>
            </div>
            <Link to="/top-charts">
              <Button variant="outline" className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {topCharts.slice(0, 5).map((song, index) => (
              <Link key={song._id} to={`/song/${song._id}`}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <Image
                        src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_25308b4add354645b8f5e229f358bbcb~mv2.png?originWidth=192&originHeight=192'}
                        alt={`${song.songTitle} album art`}
                        className="w-full aspect-square object-cover rounded-lg"
                        width={200}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <Play className="h-12 w-12 text-neon-teal" />
                      </div>
                      <div className="absolute top-2 left-2 bg-neon-teal text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {song.chartPosition}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 truncate font-heading">
                      {song.songTitle}
                    </h3>
                    <p className="text-foreground/70 text-sm truncate font-paragraph">
                      {song.artistName}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-foreground/50 font-paragraph">
                      <Clock className="h-3 w-3 mr-1" />
                      {song.duration}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Playlists Section */}
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
    </div>
  );
}