import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Playlists, Songs } from '@/entities';
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
      
      // Get the playlist to check if it has a cover image and songs
      const playlistToDelete = playlists.find(p => p._id === playlistId);
      
      if (!playlistToDelete) return;
      
      // Get all songs to find ones with matching album names
      const { items: allSongs } = await BaseCrudService.getAll<Songs>('songs');
      
      // Parse songs from playlist (it's stored as a string)
      const playlistSongIds = playlistToDelete.songs ? playlistToDelete.songs.split(',').map(s => s.trim()) : [];
      
      // Find songs in this playlist to get their album names
      const songsInPlaylist = allSongs.filter(song => playlistSongIds.includes(song._id));
      const albumNamesToDelete = new Set(songsInPlaylist.map(song => song.albumName).filter(Boolean));
      
      // Find all songs with matching album names (cascade delete)
      const songsToDelete = allSongs.filter(song => 
        song.albumName && albumNamesToDelete.has(song.albumName)
      );
      
      // Delete all matching songs
      for (const song of songsToDelete) {
        await BaseCrudService.delete('songs', song._id);
        if (song.albumArt) {
          console.log(`Album art reference removed: ${song.albumArt}`);
        }
      }
      
      // Delete the playlist from database
      await BaseCrudService.delete('playlists', playlistId);
      
      // Log cover image removal for production cleanup
      if (playlistToDelete.coverImage) {
        console.log(`Cover image reference removed: ${playlistToDelete.coverImage}`);
      }
      
      // Remove from local state immediately
      setPlaylists(prev => prev.filter(playlist => playlist._id !== playlistId));
      
      // Show success toast
      toast({
        title: "Playlist deleted",
        description: `"${playlistName}" and ${songsToDelete.length} associated song(s) have been permanently removed.`,
        variant: "default",
      });
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
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