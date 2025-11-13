import { useState } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs, Playlists } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ListMusic, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface AddToPlaylistProps {
  song: Songs;
  playlists: Playlists[];
  onPlaylistUpdate?: () => void;
  onFeedback?: (message: string) => void;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function AddToPlaylist({ 
  song, 
  playlists, 
  onPlaylistUpdate, 
  onFeedback,
  variant = 'dropdown',
  size = 'sm',
  className = ''
}: AddToPlaylistProps) {
  const { member } = useMember();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      setIsLoading(true);
      const playlist = playlists.find(p => p._id === playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Get current songs in playlist (if any)
      const currentSongs = playlist.songs ? playlist.songs.split(',').filter(id => id.trim()) : [];
      
      // Check if song is already in playlist
      if (currentSongs.includes(song._id)) {
        onFeedback?.(`"${song.title}" is already in "${playlist.playlistName}"`);
        return;
      }

      // Add song to playlist
      const updatedSongs = [...currentSongs, song._id].join(',');
      
      await BaseCrudService.update('playlists', {
        _id: playlist._id,
        songs: updatedSongs
      });

      onFeedback?.(`Added "${song.title}" to "${playlist.playlistName}"`);
      onPlaylistUpdate?.();
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      onFeedback?.('Failed to add song to playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setIsLoading(true);
      const playlistId = crypto.randomUUID();
      
      const newPlaylist: Partial<Playlists> = {
        _id: playlistId,
        playlistName: newPlaylistName.trim(),
        description: `Created for "${song.title}"`,
        songs: song._id,
        creator: member?.loginEmail || (member as any)?._id || 'unknown',
        uploadedBy: member?.loginEmail || (member as any)?._id || 'unknown',
        isPublic: false,
        creationDate: new Date()
      };
      
      await BaseCrudService.create('playlists', newPlaylist as any);
      
      onFeedback?.(`Created playlist "${newPlaylistName}" with "${song.title}"`);
      onPlaylistUpdate?.();
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      onFeedback?.('Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <Dialog open={isCreatingPlaylist} onOpenChange={setIsCreatingPlaylist}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={`hover:bg-secondary/20 ${className}`}
            title="Add to Playlist"
            disabled={isLoading}
          >
            <ListMusic className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-deep-space-blue border-white/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add to Playlist</DialogTitle>
            <DialogDescription className="text-foreground/70">
              Choose an existing playlist or create a new one for "{song.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {playlists.length > 0 && (
              <div>
                <Label className="text-foreground">Existing Playlists</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <Button
                      key={playlist._id}
                      variant="outline"
                      className="w-full justify-start border-white/20 hover:bg-white/10"
                      onClick={() => handleAddToPlaylist(playlist._id)}
                      disabled={isLoading}
                    >
                      {playlist.playlistName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="newPlaylistName" className="text-foreground">Create New Playlist</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="newPlaylistName"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="bg-white/5 border-white/20 text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewPlaylist();
                    }
                  }}
                />
                <Button 
                  onClick={handleCreateNewPlaylist}
                  disabled={!newPlaylistName.trim() || isLoading}
                  className="bg-neon-teal text-black hover:bg-neon-teal/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`hover:bg-secondary/20 ${className}`}
          title="Add to Playlist"
          disabled={isLoading}
        >
          <ListMusic className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-deep-space-blue border-white/20">
        {playlists.length > 0 && (
          <>
            {playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist._id}
                onClick={() => handleAddToPlaylist(playlist._id)}
                className="text-foreground hover:bg-white/10 cursor-pointer"
                disabled={isLoading}
              >
                {playlist.playlistName}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/20" />
          </>
        )}
        <Dialog open={isCreatingPlaylist} onOpenChange={setIsCreatingPlaylist}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-neon-teal hover:bg-white/10 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Playlist
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="bg-deep-space-blue border-white/20">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Playlist</DialogTitle>
              <DialogDescription className="text-foreground/70">
                Create a new playlist and add "{song.title}" to it
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPlaylistName" className="text-foreground">Playlist Name</Label>
                <Input
                  id="newPlaylistName"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="bg-white/5 border-white/20 text-foreground mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewPlaylist();
                    }
                  }}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingPlaylist(false)}
                className="border-white/20 text-foreground hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNewPlaylist}
                disabled={!newPlaylistName.trim() || isLoading}
                className="bg-neon-teal text-black hover:bg-neon-teal/90"
              >
                Create & Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}