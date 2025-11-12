import { useMember } from '@/integrations';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MusicPlayer } from '@/components/ui/music-player';
import { Music, Upload, User, Home, TrendingUp, List, LogOut, Disc } from 'lucide-react';

export default function Layout() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground">
      {/* Navigation Header */}
      <nav className="bg-deep-space-blue/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[120rem] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-neon-teal" />
              <span className="text-2xl font-bold text-neon-teal font-heading">SoundLab</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                  isActive('/') 
                    ? 'bg-neon-teal/20 text-neon-teal' 
                    : 'text-foreground/70 hover:text-neon-teal hover:bg-white/5'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/top-charts" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                  isActive('/top-charts') 
                    ? 'bg-neon-teal/20 text-neon-teal' 
                    : 'text-foreground/70 hover:text-neon-teal hover:bg-white/5'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Top Charts</span>
              </Link>
              
              <Link 
                to="/playlists" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                  isActive('/playlists') 
                    ? 'bg-neon-teal/20 text-neon-teal' 
                    : 'text-foreground/70 hover:text-neon-teal hover:bg-white/5'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Playlists</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link 
                    to="/upload" 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                      isActive('/upload') 
                        ? 'bg-secondary/20 text-secondary' 
                        : 'text-foreground/70 hover:text-secondary hover:bg-white/5'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Song</span>
                  </Link>
                  
                  <Link 
                    to="/upload-album" 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                      isActive('/upload-album') 
                        ? 'bg-secondary/20 text-secondary' 
                        : 'text-foreground/70 hover:text-secondary hover:bg-white/5'
                    }`}
                  >
                    <Disc className="h-4 w-4" />
                    <span>Upload Album</span>
                  </Link>
                  
                  <Link 
                    to="/my-music" 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph ${
                      isActive('/my-music') 
                        ? 'bg-secondary/20 text-secondary' 
                        : 'text-foreground/70 hover:text-secondary hover:bg-white/5'
                    }`}
                  >
                    <Music className="h-4 w-4" />
                    <span>My Music</span>
                  </Link>
                </>
              )}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isLoading && <LoadingSpinner />}
              
              {!isAuthenticated && !isLoading && (
                <Button 
                  onClick={actions.login}
                  className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph"
                >
                  Sign In
                </Button>
              )}
              
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-paragraph text-foreground/70 hover:text-neon-teal hover:bg-white/5"
                  >
                    <User className="h-4 w-4" />
                    <span>{member?.profile?.nickname || 'Profile'}</span>
                  </Link>
                  
                  <Button 
                    onClick={actions.logout}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-foreground/70 hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24">
        <Outlet />
      </main>

      {/* Music Player */}
      <MusicPlayer />
    </div>
  );
}