import { useState, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Upload, Music, Image as ImageIcon, CheckCircle, AlertCircle, X, Edit, Play, Clock, Disc } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SongMetadata {
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  track?: number;
  year?: number;
  genre?: string;
  isEditing?: boolean;
}

interface AlbumData {
  albumName: string;
  artistName: string;
  albumArt: string;
  genre: string;
  releaseYear: string;
  description: string;
}

export default function AlbumUploadPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'album-info'>('upload');
  
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [albumData, setAlbumData] = useState<AlbumData>({
    albumName: '',
    artistName: '',
    albumArt: '',
    genre: '',
    releaseYear: new Date().getFullYear().toString(),
    description: ''
  });

  // Extract metadata from MP3 files
  const extractMetadata = async (file: File): Promise<Partial<SongMetadata>> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        // Extract basic info from filename if no embedded metadata
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const parts = fileName.split(' - ');
        
        let title = fileName;
        let artist = '';
        
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
        }
        
        resolve({
          title,
          artist,
          duration: Math.round(audio.duration),
          album: '', // Will be filled from album data
        });
        
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        // Fallback if audio can't be loaded
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        resolve({
          title: fileName,
          artist: '',
          duration: 0,
          album: '',
        });
        URL.revokeObjectURL(url);
      };
      
      audio.src = url;
    });
  };

  const handleFilesSelected = async (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      setErrorMessage('Please select audio files (MP3, WAV, etc.)');
      setUploadStatus('error');
      return;
    }

    // Check file sizes
    const oversizedFiles = audioFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Some files are too large. Maximum size is 50MB per file.`);
      setUploadStatus('error');
      return;
    }

    setUploadStatus('processing');
    setUploadProgress(0);

    try {
      const songMetadata: SongMetadata[] = [];
      
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        setUploadProgress((i / audioFiles.length) * 50); // First 50% for metadata extraction
        
        const metadata = await extractMetadata(file);
        songMetadata.push({
          file,
          title: metadata.title || file.name,
          artist: metadata.artist || '',
          album: metadata.album || '',
          duration: metadata.duration || 0,
          track: i + 1,
          genre: '',
          isEditing: false
        });
      }

      // Auto-fill album data from first song
      if (songMetadata.length > 0 && songMetadata[0].artist) {
        setAlbumData(prev => ({
          ...prev,
          artistName: songMetadata[0].artist,
          albumName: songMetadata[0].album || ''
        }));
      }

      setSongs(songMetadata);
      setUploadProgress(100);
      setUploadStatus('idle');
      setCurrentStep('metadata');
    } catch (error) {
      console.error('Error processing files:', error);
      setErrorMessage('Failed to process audio files. Please try again.');
      setUploadStatus('error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateSongMetadata = (index: number, field: keyof SongMetadata, value: string | number) => {
    setSongs(prev => prev.map((song, i) => 
      i === index ? { ...song, [field]: value } : song
    ));
  };

  const toggleEditMode = (index: number) => {
    setSongs(prev => prev.map((song, i) => 
      i === index ? { ...song, isEditing: !song.isEditing } : song
    ));
  };

  const removeSong = (index: number) => {
    setSongs(prev => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAlbumDataChange = (field: keyof AlbumData, value: string) => {
    setAlbumData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update song metadata when album info changes
    if (field === 'albumName' || field === 'artistName' || field === 'genre') {
      setSongs(prev => prev.map(song => ({
        ...song,
        [field === 'albumName' ? 'album' : field === 'artistName' ? 'artist' : 'genre']: value
      })));
    }
  };

  const simulateFileUpload = async (file: File): Promise<string> => {
    // Simulate file upload with progress
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return a working demo audio file URL for testing
    // In a real app, this would upload the actual file and return its URL
    return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
  };

  const handleFinalUpload = async () => {
    if (songs.length === 0 || !albumData.albumName || !albumData.artistName) {
      setErrorMessage('Please provide album name, artist name, and at least one song.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('processing');
    setUploadProgress(0);

    try {
      const totalSongs = songs.length;
      
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        setUploadProgress((i / totalSongs) * 100);
        
        // Simulate file upload
        const audioFileUrl = await simulateFileUpload(song.file);
        
        // Create song record in CMS
        const newSong: Partial<Songs> = {
          _id: crypto.randomUUID(),
          title: song.title,
          artistName: song.artist || albumData.artistName,
          albumName: albumData.albumName,
          genre: song.genre || albumData.genre,
          duration: song.duration,
          albumArt: albumData.albumArt || undefined,
          audioFile: audioFileUrl,
          uploadedBy: member?.loginEmail || (member as any)?._id || 'unknown',
          uploadDate: new Date(),
          releaseDate: albumData.releaseYear ? new Date(`${albumData.releaseYear}-01-01`) : new Date(),
          spotifyTrackId: undefined
        };

        await BaseCrudService.create('songs', newSong as any);
      }
      
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Reset and redirect after success
      setTimeout(() => {
        navigate('/my-music');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload album. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSongs([]);
    setAlbumData({
      albumName: '',
      artistName: '',
      albumArt: '',
      genre: '',
      releaseYear: new Date().getFullYear().toString(),
      description: ''
    });
    setCurrentStep('upload');
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground py-12">
      <div className="max-w-6xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-teal font-heading mb-2 flex items-center">
            <Disc className="h-8 w-8 mr-3" />
            Upload Album
          </h1>
          <p className="text-foreground/70 font-paragraph">Upload multiple songs as an album with automatic metadata detection</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['upload', 'metadata', 'album-info'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === step ? 'bg-neon-teal text-black' :
                  ['upload', 'metadata', 'album-info'].indexOf(currentStep) > index ? 'bg-neon-teal/20 text-neon-teal' :
                  'bg-white/10 text-foreground/50'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && <div className="w-12 h-0.5 bg-white/20 mx-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-16 text-sm font-paragraph">
            <span className={currentStep === 'upload' ? 'text-neon-teal' : 'text-foreground/50'}>Upload Files</span>
            <span className={currentStep === 'metadata' ? 'text-neon-teal' : 'text-foreground/50'}>Review Songs</span>
            <span className={currentStep === 'album-info' ? 'text-neon-teal' : 'text-foreground/50'}>Album Info</span>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <Alert className="border-green-500 bg-green-500/10 mb-6">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500 font-paragraph">
              Album uploaded successfully! Redirecting to your music library...
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="border-destructive bg-destructive/10 mb-6">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-paragraph">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Progress */}
        {(uploadStatus === 'processing' || isUploading) && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-paragraph">
                  <span>{isUploading ? 'Uploading album...' : 'Processing files...'}</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: File Upload */}
        {currentStep === 'upload' && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neon-teal font-heading flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Select Audio Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-neon-teal/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Music className="h-16 w-16 text-neon-teal mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                  Drop audio files here or click to browse
                </h3>
                <p className="text-foreground/70 font-paragraph mb-4">
                  Upload multiple MP3, WAV, or FLAC files (up to 50MB each)
                </p>
                <p className="text-foreground/50 text-sm font-paragraph">
                  Metadata will be automatically extracted from your files
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Song Metadata Review */}
        {currentStep === 'metadata' && songs.length > 0 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neon-teal font-heading flex items-center justify-between">
                <div className="flex items-center">
                  <Music className="h-5 w-5 mr-2" />
                  Review Song Metadata ({songs.length} songs)
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetUpload} size="sm">
                    Start Over
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('album-info')}
                    className="bg-neon-teal text-black hover:bg-neon-teal/90"
                    size="sm"
                  >
                    Continue
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {songs.map((song, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="border-neon-teal text-neon-teal">
                        Track {song.track}
                      </Badge>
                      <div className="flex items-center text-sm text-foreground/70 font-paragraph">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(song.duration)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEditMode(index)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSong(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {song.isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-foreground font-paragraph text-sm">Song Title</Label>
                        <Input
                          value={song.title}
                          onChange={(e) => updateSongMetadata(index, 'title', e.target.value)}
                          className="bg-white/5 border-white/20 text-foreground font-paragraph mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground font-paragraph text-sm">Artist</Label>
                        <Input
                          value={song.artist}
                          onChange={(e) => updateSongMetadata(index, 'artist', e.target.value)}
                          className="bg-white/5 border-white/20 text-foreground font-paragraph mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-foreground font-heading">{song.title}</h4>
                      <p className="text-foreground/70 font-paragraph">{song.artist || 'Unknown Artist'}</p>
                      <p className="text-foreground/50 text-sm font-paragraph">{song.file.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Album Information */}
        {currentStep === 'album-info' && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neon-teal font-heading flex items-center">
                <Disc className="h-5 w-5 mr-2" />
                Album Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="albumName" className="text-foreground font-paragraph">
                      Album Name *
                    </Label>
                    <Input
                      id="albumName"
                      value={albumData.albumName}
                      onChange={(e) => handleAlbumDataChange('albumName', e.target.value)}
                      placeholder="Enter album name"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="artistName" className="text-foreground font-paragraph">
                      Artist Name *
                    </Label>
                    <Input
                      id="artistName"
                      value={albumData.artistName}
                      onChange={(e) => handleAlbumDataChange('artistName', e.target.value)}
                      placeholder="Enter artist name"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="genre" className="text-foreground font-paragraph">
                      Genre
                    </Label>
                    <Input
                      id="genre"
                      value={albumData.genre}
                      onChange={(e) => handleAlbumDataChange('genre', e.target.value)}
                      placeholder="Enter genre"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                    />
                  </div>

                  <div>
                    <Label htmlFor="releaseYear" className="text-foreground font-paragraph">
                      Release Year
                    </Label>
                    <Input
                      id="releaseYear"
                      type="number"
                      value={albumData.releaseYear}
                      onChange={(e) => handleAlbumDataChange('releaseYear', e.target.value)}
                      placeholder="2024"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="albumArt" className="text-foreground font-paragraph flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Album Art URL
                    </Label>
                    <Input
                      id="albumArt"
                      value={albumData.albumArt}
                      onChange={(e) => handleAlbumDataChange('albumArt', e.target.value)}
                      placeholder="Enter album art image URL"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-foreground font-paragraph">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={albumData.description}
                      onChange={(e) => handleAlbumDataChange('description', e.target.value)}
                      placeholder="Enter album description (optional)"
                      className="bg-white/5 border-white/20 text-foreground font-paragraph"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Album Summary */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
                <h4 className="font-semibold text-foreground font-heading mb-2">Album Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-paragraph">
                  <div>
                    <span className="text-foreground/70">Songs:</span>
                    <div className="text-neon-teal font-semibold">{songs.length}</div>
                  </div>
                  <div>
                    <span className="text-foreground/70">Total Duration:</span>
                    <div className="text-neon-teal font-semibold">
                      {formatDuration(songs.reduce((total, song) => total + song.duration, 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-foreground/70">Artist:</span>
                    <div className="text-neon-teal font-semibold">{albumData.artistName || 'Not set'}</div>
                  </div>
                  <div>
                    <span className="text-foreground/70">Album:</span>
                    <div className="text-neon-teal font-semibold">{albumData.albumName || 'Not set'}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('metadata')}
                  className="border-white/20 text-foreground hover:bg-white/5"
                >
                  Back to Songs
                </Button>
                <div className="space-x-4">
                  <Button
                    variant="outline"
                    onClick={resetUpload}
                    className="border-white/20 text-foreground hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFinalUpload}
                    disabled={isUploading || !albumData.albumName || !albumData.artistName || songs.length === 0}
                    className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph"
                  >
                    {isUploading ? 'Uploading...' : `Upload Album (${songs.length} songs)`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}