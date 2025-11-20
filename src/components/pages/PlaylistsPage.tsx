import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Playlists } from '@/entities';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, Music, Calendar, ArrowLeft, Lock, Globe, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useMember } from '@/integrations';
import { useToast } from '@/hooks/use-toast';

export default function PlaylistsPage() {
  const { member } = useMember();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlists[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    try {
      setDeletingPlaylistId(playlistId);
      
      // Get the playlist to check if it has a cover image
      const playlistToDelete = playlists.find(p => p._id === playlistId);
      
      // Delete from database
      await BaseCrudService.delete('playlists', playlistId);
      
      // Log cover image removal for production cleanup
      if (playlistToDelete?.coverImage) {
        console.log(`Cover image reference removed: ${playlistToDelete.coverImage}`);
        // In production: await deleteImageFromCloudStorage(playlistToDelete.coverImage);
      }
      
      // Remove from local state immediately
      setPlaylists(prev => prev.filter(playlist => playlist._id !== playlistId));
      
      // Show success toast
      toast({
        title: "Playlist deleted",
        description: `"${playlistName}" and all associated data have been permanently removed.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error deleting playlist:', error);
      
      // Show error toast
      toast({
        title: "Delete failed",
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingPlaylistId(null);
    }
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await BaseCrudService.getAll<Playlists>('playlists');
        
        // Filter to show only user's own playlists
        const userPlaylists = response.items.filter(playlist => 
          playlist.uploadedBy === member?.loginEmail || 
          playlist.uploadedBy === (member as any)?._id ||
          playlist.creator === member?.loginEmail ||
          playlist.creator === (member as any)?._id
        );
        
        // Sort by creation date, newest first
        const sortedPlaylists = userPlaylists.sort((a, b) => {
          const dateA = new Date(a.creationDate || a._createdDate || 0);
          const dateB = new Date(b.creationDate || b._createdDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setPlaylists(sortedPlaylists);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (member) {
      fetchPlaylists();
    } else {
      setIsLoading(false);
    }
  }, [member]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space-blue flex items-center justify-center">
        <div className="text-neon-teal text-xl font-paragraph">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <Link to="/" className="inline-flex items-center text-secondary hover:text-secondary/80 mb-6 font-paragraph">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Music className="h-12 w-12 text-secondary" />
            <div>
              <h1 className="text-5xl font-bold text-secondary font-heading mb-2">My Playlists</h1>
              <p className="text-foreground/70 text-lg font-paragraph">
                Your personal music collections
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Playlists Grid */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Playlist Card */}
              <Link to={`/playlist/${playlist._id}`}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group h-full">
                  <CardContent className="p-6">
                    {/* Cover Image */}
                    <div className="relative mb-6">
                      <Image
                        src={playlist.coverImage || 'https://static.wixstatic.com/media/888b2d_ac56cbc48467448ebc5064b23237998b~mv2.png?originWidth=256&originHeight=256'}
                        alt={`${playlist.playlistName} cover`}
                        className="w-full aspect-square object-cover rounded-lg"
                        width={300}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <Play className="h-16 w-16 text-secondary" />
                      </div>
                      
                      {/* Privacy Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant={playlist.isPublic ? "default" : "secondary"}
                          className={playlist.isPublic ? "bg-neon-teal text-black" : "bg-foreground/20 text-foreground"}
                        >
                          {playlist.isPublic ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Playlist Info */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-secondary transition-colors font-heading line-clamp-2">
                        {playlist.playlistName}
                      </h3>
                      
                      {playlist.description && (
                        <p className="text-foreground/70 text-sm font-paragraph line-clamp-3">
                          {playlist.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {playlist.creator && (
                          <p className="text-secondary text-sm font-paragraph">
                            By {playlist.creator}
                          </p>
                        )}
                        
                        {(playlist.creationDate || playlist._createdDate) && (
                          <div className="flex items-center text-xs text-foreground/50 font-paragraph">
                            <Calendar className="h-3 w-3 mr-1" />
                            Created {format(new Date(playlist.creationDate || playlist._createdDate!), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Delete Button */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-black/60 hover:bg-destructive hover:text-destructive-foreground text-white backdrop-blur-sm shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      disabled={deletingPlaylistId === playlist._id}
                    >
                      {deletingPlaylistId === playlist._id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-deep-space-blue border-white/20 max-w-md">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <AlertDialogTitle className="text-foreground font-heading text-lg">
                          Delete Playlist
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-foreground/70 font-paragraph text-sm leading-relaxed">
                        Are you sure you want to delete <span className="font-semibold text-foreground">"{playlist.playlistName}"</span>? 
                        <br /><br />
                        This action cannot be undone and will permanently remove the playlist from your library.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel 
                        className="border-white/20 text-foreground hover:bg-white/10 font-paragraph"
                        disabled={deletingPlaylistId === playlist._id}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeletePlaylist(playlist._id, playlist.playlistName || 'Untitled Playlist');
                        }}
                        disabled={deletingPlaylistId === playlist._id}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-paragraph min-w-[120px]"
                      >
                        {deletingPlaylistId === playlist._id ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Deleting...
                          </div>
                        ) : (
                          'Delete Playlist'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>

        {playlists.length === 0 && !member && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">Sign in to view your playlists</h3>
            <p className="text-foreground/50 font-paragraph">Create an account to start building your music collections</p>
          </div>
        )}

        {playlists.length === 0 && member && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/70 mb-2 font-heading">No playlists yet</h3>
            <p className="text-foreground/50 font-paragraph">Create your first playlist to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}