import { useMember } from '@/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Music } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { member } = useMember();

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
                  <div className="text-3xl font-bold text-neon-teal font-heading">0</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Songs Uploaded</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary font-heading">0</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Playlists Created</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground font-heading">0</div>
                  <p className="text-sm text-foreground/70 font-paragraph">Total Plays</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}