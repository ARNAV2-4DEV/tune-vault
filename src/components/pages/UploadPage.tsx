import { useState } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Music, Image as ImageIcon, CheckCircle, AlertCircle, Disc, FolderOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function UploadPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    albumName: '',
    genre: '',
    audioFile: null as File | null,
    albumArt: '',
    duration: 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setErrorMessage('Please select a valid audio file (MP3, WAV, etc.)');
        setUploadStatus('error');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('File size must be less than 50MB');
        setUploadStatus('error');
        return;
      }

      setFormData(prev => ({ ...prev, audioFile: file }));
      setUploadStatus('idle');
      setErrorMessage('');

      // Get audio duration
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        setFormData(prev => ({ ...prev, duration: Math.round(audio.duration) }));
      };
      audio.src = URL.createObjectURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadAudioFile = async (file: File): Promise<string> => {
    // Simulate file upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Create a blob URL for the actual uploaded file
    // This allows the audio player to play the real uploaded audio
    const audioUrl = URL.createObjectURL(file);
    
    // In a real production app, you would upload to a cloud storage service
    // and return the permanent URL. For now, we use the blob URL which works
    // for the current session.
    return audioUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.audioFile || !formData.title || !formData.artistName) {
      setErrorMessage('Please fill in all required fields and select an audio file');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);

    try {
      // Upload the actual audio file
      const audioFileUrl = await uploadAudioFile(formData.audioFile);
      
      // Create song record in CMS
      const newSong: Partial<Songs> = {
        _id: crypto.randomUUID(),
        title: formData.title,
        artistName: formData.artistName,
        albumName: formData.albumName || undefined,
        genre: formData.genre || undefined,
        duration: formData.duration,
        albumArt: formData.albumArt || undefined,
        audioFile: audioFileUrl,
        uploadedBy: member?.loginEmail || (member as any)?._id || 'unknown',
        uploadDate: new Date(),
        releaseDate: new Date(),
        spotifyTrackId: undefined
      };

      await BaseCrudService.create('songs', newSong as any);
      
      setUploadStatus('success');
      
      // Reset form after successful upload
      setTimeout(() => {
        setFormData({
          title: '',
          artistName: '',
          albumName: '',
          genre: '',
          audioFile: null,
          albumArt: '',
          duration: 0
        });
        setUploadProgress(0);
        
        // Note: The uploaded audio will be available for playback during this browser session.
        // In a production app, files would be uploaded to permanent cloud storage.
        navigate('/my-music');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload song. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground py-12">
      <div className="max-w-4xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-teal font-heading mb-2">Upload Single Song</h1>
          <p className="text-foreground/70 font-paragraph">
            Upload a single track, <Link to="/upload-album" className="text-secondary hover:underline">upload an entire album</Link>, or <Link to="/upload-folder" className="text-secondary hover:underline">upload a folder</Link>
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-neon-teal font-heading flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Song Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audio File Upload */}
              <div className="space-y-2">
                <Label htmlFor="audioFile" className="text-foreground font-paragraph">
                  Audio File *
                </Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-neon-teal/50 transition-colors">
                  <input
                    type="file"
                    id="audioFile"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="audioFile" className="cursor-pointer">
                    <Music className="h-12 w-12 text-neon-teal mx-auto mb-4" />
                    <p className="text-foreground font-paragraph mb-2">
                      {formData.audioFile ? formData.audioFile.name : 'Click to upload audio file'}
                    </p>
                    <p className="text-foreground/50 text-sm font-paragraph">
                      MP3, WAV, FLAC up to 50MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-paragraph">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <Alert className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500 font-paragraph">
                    Song uploaded successfully! Redirecting to your music library...
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive font-paragraph">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Song Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground font-paragraph">
                    Song Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter song title"
                    className="bg-white/5 border-white/20 text-foreground font-paragraph"
                    required
                  />
                </div>

                {/* Artist Name */}
                <div className="space-y-2">
                  <Label htmlFor="artistName" className="text-foreground font-paragraph">
                    Artist Name *
                  </Label>
                  <Input
                    id="artistName"
                    name="artistName"
                    value={formData.artistName}
                    onChange={handleInputChange}
                    placeholder="Enter artist name"
                    className="bg-white/5 border-white/20 text-foreground font-paragraph"
                    required
                  />
                </div>

                {/* Album Name */}
                <div className="space-y-2">
                  <Label htmlFor="albumName" className="text-foreground font-paragraph">
                    Album Name
                  </Label>
                  <Input
                    id="albumName"
                    name="albumName"
                    value={formData.albumName}
                    onChange={handleInputChange}
                    placeholder="Enter album name (optional)"
                    className="bg-white/5 border-white/20 text-foreground font-paragraph"
                  />
                </div>

                {/* Genre */}
                <div className="space-y-2">
                  <Label htmlFor="genre" className="text-foreground font-paragraph">
                    Genre
                  </Label>
                  <Input
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    placeholder="Enter genre (optional)"
                    className="bg-white/5 border-white/20 text-foreground font-paragraph"
                  />
                </div>
              </div>

              {/* Album Art URL */}
              <div className="space-y-2">
                <Label htmlFor="albumArt" className="text-foreground font-paragraph flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Album Art URL
                </Label>
                <Input
                  id="albumArt"
                  name="albumArt"
                  value={formData.albumArt}
                  onChange={handleInputChange}
                  placeholder="Enter album art image URL (optional)"
                  className="bg-white/5 border-white/20 text-foreground font-paragraph"
                />
              </div>

              {/* Duration Display */}
              {formData.duration > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground font-paragraph">Duration</Label>
                  <p className="text-neon-teal font-paragraph">
                    {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link to="/upload-folder">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-black"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Upload Folder Instead
                  </Button>
                </Link>
                <Link to="/upload-album">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary hover:text-black"
                  >
                    <Disc className="h-4 w-4 mr-2" />
                    Upload Album Instead
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/my-music')}
                  className="border-white/20 text-foreground hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !formData.audioFile || !formData.title || !formData.artistName}
                  className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph"
                >
                  {isUploading ? 'Uploading...' : 'Upload Song'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}