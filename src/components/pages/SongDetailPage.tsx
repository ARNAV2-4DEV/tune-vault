import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Songs, TopCharts } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, ArrowLeft, Music, Disc, User, ExternalLink, Heart, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<Songs | TopCharts | null>(null);
  const [relatedSongs, setRelatedSongs] = useState<Songs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCharts, setIsFromCharts] = useState(false);

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!id) {
        setError('Song ID not found');
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch from songs first
        let songData: Songs | TopCharts | null = null;
        let fromCharts = false;

        try {
          songData = await BaseCrudService.getById<Songs>('songs', id);
        } catch {
          // If not found in songs, try top charts
          try {
            songData = await BaseCrudService.getById<TopCharts>('topcharts', id);
            fromCharts = true;
          } catch {
            setError('Song not found');
            setIsLoading(false);
            return;
          }
        }

        setSong(songData);
        setIsFromCharts(fromCharts);

        // Fetch related songs based on genre or artist
        const songsResponse = await BaseCrudService.getAll<Songs>('songs');
        const artistName = fromCharts ? (songData as TopCharts).artistName : (songData as Songs).artistName;
        const genre = fromCharts ? (songData as TopCharts).genre : (songData as Songs).genre;
        
        const related = songsResponse.items
          .filter(s => s._id !== id && (s.artistName === artistName || s.genre === genre))
          .slice(0, 6);
        
        setRelatedSongs(related);
      } catch (error) {
        console.error('Error fetching song:', error);
        setError('Failed to load song details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading song...</div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-center">
          <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">Song not found</h3>
          <p className="text-foreground/50 font-paragraph mb-6">{error || 'The song you\'re looking for doesn\'t exist'}</p>
          <Link to="/">
            <Button className="bg-neon-teal text-black hover:bg-neon-teal/90">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const songTitle = isFromCharts ? (song as TopCharts).songTitle : (song as Songs).title;
  const artistName = song.artistName;
  const albumName = isFromCharts ? undefined : (song as Songs).albumName;
  const albumArt = song.albumArt;
  const genre = song.genre;
  const duration = isFromCharts ? (song as TopCharts).duration : (song as Songs).duration;
  const releaseDate = isFromCharts ? undefined : (song as Songs).releaseDate;
  const chartPosition = isFromCharts ? (song as TopCharts).chartPosition : undefined;
  const externalUrl = isFromCharts ? (song as TopCharts).externalUrl : undefined;

  const formatDuration = (dur: string | number | undefined) => {
    if (!dur) return '--:--';
    if (typeof dur === 'string') return dur;
    const minutes = Math.floor(dur / 60);
    const seconds = dur % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-neon-teal/20 to-transparent">
        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <Link 
            to={isFromCharts ? "/top-charts" : "/"} 
            className="inline-flex items-center text-neon-teal hover:text-neon-teal/80 mb-8 font-paragraph"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFromCharts ? 'Back to Top Charts' : 'Back to Home'}
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-8 items-start"
          >
            {/* Album Art */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Image
                  src={albumArt || 'https://static.wixstatic.com/media/888b2d_0a6559c31f5c4f6e83793704ccc49878~mv2.png?originWidth=320&originHeight=320'}
                  alt={`${songTitle} album art`}
                  className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
                  width={320}
                />
                <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                {chartPosition && (
                  <div className="absolute top-4 left-4 bg-neon-teal text-black rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
                    #{chartPosition}
                  </div>
                )}
              </div>
            </div>

            {/* Song Info */}
            <div className="flex-grow space-y-6">
              <div className="space-y-2">
                {isFromCharts && (
                  <Badge className="bg-neon-teal text-black">
                    Top Chart
                  </Badge>
                )}
                <h1 className="text-5xl font-bold text-neon-teal font-heading">
                  {songTitle}
                </h1>
                <p className="text-2xl text-foreground/80 font-paragraph">
                  by {artistName}
                </p>
              </div>

              {/* Song Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {albumName && (
                    <div className="flex items-center gap-3">
                      <Disc className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm text-foreground/70 font-paragraph">Album</p>
                        <p className="text-foreground font-paragraph">{albumName}</p>
                      </div>
                    </div>
                  )}
                  
                  {genre && (
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm text-foreground/70 font-paragraph">Genre</p>
                        <Badge variant="outline" className="border-secondary text-secondary">
                          {genre}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-foreground/70 font-paragraph">Duration</p>
                      <p className="text-foreground font-paragraph">{formatDuration(duration)}</p>
                    </div>
                  </div>
                  
                  {releaseDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm text-foreground/70 font-paragraph">Release Date</p>
                        <p className="text-foreground font-paragraph">
                          {format(new Date(releaseDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-neon-teal text-black hover:bg-neon-teal/90">
                  <Play className="h-5 w-5 mr-2" />
                  Play Now
                </Button>
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black">
                  <Heart className="h-5 w-5 mr-2" />
                  Like
                </Button>
                <Button size="lg" variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground hover:text-black">
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Playlist
                </Button>
                {externalUrl && (
                  <Button size="lg" variant="outline" asChild className="border-foreground/30 text-foreground hover:bg-foreground hover:text-black">
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Open External
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Related Songs */}
      {relatedSongs.length > 0 && (
        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <h2 className="text-3xl font-bold text-secondary font-heading mb-8">More from {artistName}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedSongs.map((relatedSong, index) => (
              <motion.div
                key={relatedSong._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/song/${relatedSong._id}`}>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="relative mb-4">
                        <Image
                          src={relatedSong.albumArt || 'https://static.wixstatic.com/media/888b2d_924fd27a22c6482991c6d789097157f9~mv2.png?originWidth=192&originHeight=192'}
                          alt={`${relatedSong.title} album art`}
                          className="w-full aspect-square object-cover rounded-lg"
                          width={200}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <Play className="h-12 w-12 text-neon-teal" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 truncate font-heading">
                        {relatedSong.title}
                      </h3>
                      <p className="text-foreground/70 text-sm truncate font-paragraph">
                        {relatedSong.artistName}
                      </p>
                      {relatedSong.albumName && (
                        <p className="text-foreground/50 text-xs truncate font-paragraph mt-1">
                          {relatedSong.albumName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}