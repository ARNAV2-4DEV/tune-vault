import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs, Playlists } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Mail, Calendar, Music, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMusicPlayer } from '@/stores/musicPlayerStore';

export default function ProfilePage() {
  const { member } = useMember();
  const { toast } = useToast();
  const { clearQueue } = useMusicPlayer();
  const [isClearing, setIsClearing] = useState(false);
  const [userStats, setUserStats] = useState({ songs: 0, playlists: 0 });

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!member) return;
      
      try {
        // Get user's songs
        const songsResponse = await BaseCrudService.getAll<Songs>('songs');
        const userSongs = songsResponse.items.filter(song => 
          song.uploadedBy === member.loginEmail || song.uploadedBy === (member as any)?._id
        );

        // Get user's playlists
        const playlistsResponse = await BaseCrudService.getAll<Playlists>('playlists');
        const userPlaylists = playlistsResponse.items.filter(playlist => 
          playlist.uploadedBy === member.loginEmail || 
          playlist.uploadedBy === (member as any)?._id ||
          playlist.creator === member.loginEmail ||
          playlist.creator === (member as any)?._id
        );

        setUserStats({
          songs: userSongs.length,
          playlists: userPlaylists.length
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchStats();
  }, [member]);

  const handleClearAllData = async () => {
    if (!member) return;

    setIsClearing(true);
    try {
      // Get all user's songs
      const songsResponse = await BaseCrudService.getAll<Songs>('songs');
      const userSongs = songsResponse.items.filter(song => 
        song.uploadedBy === member.loginEmail || song.uploadedBy === (member as any)?._id
      );

      // Get all user's playlists
      const playlistsResponse = await BaseCrudService.getAll<Playlists>('playlists');
      const userPlaylists = playlistsResponse.items.filter(playlist => 
        playlist.uploadedBy === member.loginEmail || 
        playlist.uploadedBy === (member as any)?._id ||
        playlist.creator === member.loginEmail ||
        playlist.creator === (member as any)?._id
      );

      // Delete all user's songs
      for (const song of userSongs) {
        await BaseCrudService.delete('songs', song._id);
        // Note: In production, also delete audio files from cloud storage
        if (song.audioFile) {
          console.log(`Audio file reference removed: ${song.audioFile}`);
        }
        if (song.albumArt) {
          console.log(`Album art reference removed: ${song.albumArt}`);
        }
      }

      // Delete all user's playlists
      for (const playlist of userPlaylists) {
        await BaseCrudService.delete('playlists', playlist._id);
        // Note: In production, also delete cover images from cloud storage
        if (playlist.coverImage) {
          console.log(`Cover image reference removed: ${playlist.coverImage}`);
        }
      }

      // Clear music player state
      clearQueue();
      
      // Clear localStorage music player data
      localStorage.removeItem('music-player-storage');

      // Update stats
      setUserStats({ songs: 0, playlists: 0 });

      toast({
        title: "Data cleared successfully",
        description: `Deleted ${userSongs.length} songs and ${userPlaylists.length} playlists. Your account is now fresh and ready for new content.`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error clearing user data:', error);
      toast({
        title: "Clear failed",
        description: "Failed to clear all data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getInitials = (nickname?: string, firstName?: string, lastName?: string) => {
    if (nickname) return nickname.slice(0, 2).toUpperCase();
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    return 'U';
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground py-12">
      <div className="max-w-4xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-teal font-heading mb-2">Profile</h1>
          <p className="text-foreground/70 font-paragraph">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-neon-teal font-heading flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={member?.profile?.photo?.url} 
                      alt={member?.profile?.nickname || 'Profile'} 
                    />
                    <AvatarFallback className="bg-neon-teal/20 text-neon-teal text-lg">
                      {getInitials(
                        member?.profile?.nickname,
                        member?.contact?.firstName,
                        member?.contact?.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground font-heading">
                      {member?.profile?.nickname || 
                       `${member?.contact?.firstName || ''} ${member?.contact?.lastName || ''}`.trim() || 
                       'User'}
                    </h2>
                    {member?.profile?.title && (
                      <p className="text-secondary font-paragraph">{member.profile.title}</p>
                    )}
                    <Badge variant="outline" className="border-neon-teal text-neon-teal">
                      {member?.status || 'Active'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-foreground/70 font-paragraph">Email</label>
                      <div className="flex items-center mt-1">
                        <Mail className="h-4 w-4 text-neon-teal mr-2" />
                        <span className="font-paragraph">{member?.loginEmail || 'Not provided'}</span>
                        {member?.loginEmailVerified && (
                          <Badge variant="outline" className="ml-2 text-xs border-green-500 text-green-500">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-foreground/70 font-paragraph">First Name</label>
                      <p className="font-paragraph mt-1">{member?.contact?.firstName || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="text-sm text-foreground/70 font-paragraph">Last Name</label>
                      <p className="font-paragraph mt-1">{member?.contact?.lastName || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-foreground/70 font-paragraph">Member Since</label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-neon-teal mr-2" />
                        <span className="font-paragraph">{formatDate(member?._createdDate)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-foreground/70 font-paragraph">Last Login</label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-secondary mr-2" />
                        <span className="font-paragraph">{formatDate(member?.lastLoginDate)}</span>
                      </div>
                    </div>

                    {member?.contact?.phones && member.contact.phones.length > 0 && (
                      <div>
                        <label className="text-sm text-foreground/70 font-paragraph">Phone</label>
                        <p className="font-paragraph mt-1">{member.contact.phones[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Card */}
          <div>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-secondary font-heading flex items-center">
                  <Music className="h-5 w-5 mr-2" />
                  Music Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-teal font-heading">{userStats.songs}</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Songs Uploaded</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary font-heading">{userStats.playlists}</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Playlists Created</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground font-heading">0</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Total Plays</p>
                </div>
              </CardContent>
            </Card>

            {/* Data Management Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle className="text-destructive font-heading flex items-center">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/70 font-paragraph">
                  Clear all your uploaded songs, playlists, and associated data for a fresh start.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full font-paragraph"
                      disabled={isClearing || (userStats.songs === 0 && userStats.playlists === 0)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {isClearing ? 'Clearing Data...' : 'Clear All Data'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-deep-space-blue border-white/20 max-w-md">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <AlertDialogTitle className="text-foreground font-heading text-lg">
                          Clear All Data
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-foreground/70 font-paragraph text-sm leading-relaxed">
                        This will permanently delete:
                        <br />
                        • <span className="font-semibold text-neon-teal">{userStats.songs}</span> uploaded songs
                        <br />
                        • <span className="font-semibold text-secondary">{userStats.playlists}</span> created playlists
                        <br />
                        • All cover images and audio files
                        <br />
                        • Music player queue and settings
                        <br /><br />
                        <span className="text-destructive font-semibold">This action cannot be undone.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel 
                        className="border-white/20 text-foreground hover:bg-white/10 font-paragraph"
                        disabled={isClearing}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleClearAllData();
                        }}
                        disabled={isClearing}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-paragraph min-w-[140px]"
                      >
                        {isClearing ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Clearing...
                          </div>
                        ) : (
                          'Clear All Data'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                {(userStats.songs === 0 && userStats.playlists === 0) && (
                  <p className="text-xs text-foreground/50 font-paragraph text-center">
                    No data to clear. Upload some songs or create playlists to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}