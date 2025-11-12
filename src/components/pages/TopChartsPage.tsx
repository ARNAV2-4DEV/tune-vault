import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { TopCharts } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, ExternalLink, TrendingUp, ArrowLeft } from 'lucide-react';

export default function TopChartsPage() {
  const [topCharts, setTopCharts] = useState<TopCharts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopCharts = async () => {
      try {
        const response = await BaseCrudService.getAll<TopCharts>('topcharts');
        const sortedCharts = response.items.sort((a, b) => (a.chartPosition || 0) - (b.chartPosition || 0));
        setTopCharts(sortedCharts);
      } catch (error) {
        console.error('Error fetching top charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopCharts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading charts...</div>
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
              <h1 className="text-5xl font-bold text-neon-teal font-heading mb-2">Top Charts</h1>
              <p className="text-foreground/70 text-lg font-paragraph">
                The hottest tracks trending right now
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="grid gap-4">
          {topCharts.map((song, index) => (
            <motion.div
              key={song._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Chart Position */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-neon-teal text-black rounded-lg flex items-center justify-center font-bold text-lg font-paragraph">
                        {song.chartPosition}
                      </div>
                    </div>

                    {/* Album Art */}
                    <div className="flex-shrink-0 relative">
                      <Image
                        src={song.albumArt || 'https://static.wixstatic.com/media/888b2d_32fea6ce5b32413997aac344ddfde269~mv2.png?originWidth=128&originHeight=128'}
                        alt={`${song.songTitle} album art`}
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
                          {song.songTitle}
                        </h3>
                      </Link>
                      <p className="text-foreground/70 font-paragraph truncate">
                        {song.artistName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50 font-paragraph">
                        {song.genre && (
                          <span className="bg-secondary/20 text-secondary px-2 py-1 rounded">
                            {song.genre}
                          </span>
                        )}
                        {song.duration && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {song.duration}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link to={`/song/${song._id}`}>
                        <Button size="sm" className="bg-neon-teal text-black hover:bg-neon-teal/90">
                          View Details
                        </Button>
                      </Link>
                      {song.externalUrl && (
                        <a 
                          href={song.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-foreground/70 hover:text-neon-teal transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {topCharts.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">No charts available</h3>
            <p className="text-foreground/50 font-paragraph">Check back later for the latest trending tracks</p>
          </div>
        )}
      </div>
    </div>
  );
}