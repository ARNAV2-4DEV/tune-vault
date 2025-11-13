import { useState, useRef } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Songs } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { FolderOpen, Music, Image as ImageIcon, CheckCircle, AlertCircle, X, Edit, Clock, Upload, FileAudio, FileImage, Link as LinkIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface ProcessedFile {
  file: File;
  type: 'audio' | 'image';
  name: string;
  size: number;
  path: string;
}

interface SongWithImage {
  audioFile: ProcessedFile;
  imageFile?: ProcessedFile;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre?: string;
  isEditing?: boolean;
  matched: boolean;
}

interface FolderData {
  folderName: string;
  totalFiles: number;
  audioFiles: number;
  imageFiles: number;
  matchedPairs: number;
}

export default function FolderUploadPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'final'>('upload');
  
  const [songs, setSongs] = useState<SongWithImage[]>([]);
  const [folderData, setFolderData] = useState<FolderData>({
    folderName: '',
    totalFiles: 0,
    audioFiles: 0,
    imageFiles: 0,
    matchedPairs: 0
  });

  // Extract metadata from audio files
  const extractAudioMetadata = async (file: File): Promise<Partial<SongWithImage>> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        // Extract basic info from filename
        const fileName = file.name.replace(/\.[^/.]+$/, "");
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
          album: '',
        });
        
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
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

  // Match images to audio files based on filename similarity
  const matchFilesToImages = (audioFiles: ProcessedFile[], imageFiles: ProcessedFile[]): SongWithImage[] => {
    const songs: SongWithImage[] = [];
    
    audioFiles.forEach(audioFile => {
      const audioBaseName = audioFile.name.replace(/\.[^/.]+$/, "").toLowerCase();
      
      // Find matching image file
      const matchingImage = imageFiles.find(imageFile => {
        const imageBaseName = imageFile.name.replace(/\.[^/.]+$/, "").toLowerCase();
        
        // Exact match
        if (audioBaseName === imageBaseName) return true;
        
        // Check if image name is contained in audio name or vice versa
        if (audioBaseName.includes(imageBaseName) || imageBaseName.includes(audioBaseName)) return true;
        
        // Check for common patterns like "cover", "artwork", "album"
        const commonNames = ['cover', 'artwork', 'album', 'folder'];
        if (commonNames.some(name => imageBaseName.includes(name))) {
          return true;
        }
        
        return false;
      });
      
      songs.push({
        audioFile,
        imageFile: matchingImage,
        title: audioFile.name.replace(/\.[^/.]+$/, ""),
        artist: '',
        album: '',
        duration: 0,
        matched: !!matchingImage,
        isEditing: false
      });
    });
    
    return songs;
  };

  // Process folder contents
  const processFolderContents = async (files: FileList) => {
    const processedFiles: ProcessedFile[] = [];
    const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    // Process all files
    Array.from(files).forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const relativePath = (file as any).webkitRelativePath || file.name;
      
      if (audioExtensions.includes(extension)) {
        processedFiles.push({
          file,
          type: 'audio',
          name: file.name,
          size: file.size,
          path: relativePath
        });
      } else if (imageExtensions.includes(extension)) {
        processedFiles.push({
          file,
          type: 'image',
          name: file.name,
          size: file.size,
          path: relativePath
        });
      }
    });

    const audioFiles = processedFiles.filter(f => f.type === 'audio');
    const imageFiles = processedFiles.filter(f => f.type === 'image');

    if (audioFiles.length === 0) {
      setErrorMessage('No audio files found in the selected folder. Please select a folder containing music files.');
      setUploadStatus('error');
      return;
    }

    // Check file sizes
    const oversizedFiles = audioFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Some audio files are too large. Maximum size is 50MB per file.`);
      setUploadStatus('error');
      return;
    }

    setUploadStatus('processing');
    setUploadProgress(0);

    try {
      // Match files and extract metadata
      const matchedSongs = matchFilesToImages(audioFiles, imageFiles);
      const songsWithMetadata: SongWithImage[] = [];
      
      for (let i = 0; i < matchedSongs.length; i++) {
        const song = matchedSongs[i];
        setUploadProgress((i / matchedSongs.length) * 100);
        
        const metadata = await extractAudioMetadata(song.audioFile.file);
        songsWithMetadata.push({
          ...song,
          title: metadata.title || song.title,
          artist: metadata.artist || '',
          album: metadata.album || '',
          duration: metadata.duration || 0,
        });
      }

      // Extract folder name from first file path
      const firstFilePath = files[0] && (files[0] as any).webkitRelativePath;
      const folderName = firstFilePath ? firstFilePath.split('/')[0] : 'Unknown Folder';

      setFolderData({
        folderName,
        totalFiles: files.length,
        audioFiles: audioFiles.length,
        imageFiles: imageFiles.length,
        matchedPairs: songsWithMetadata.filter(s => s.matched).length
      });

      setSongs(songsWithMetadata);
      setUploadProgress(100);
      setUploadStatus('idle');
      setCurrentStep('review');
    } catch (error) {
      console.error('Error processing folder:', error);
      setErrorMessage('Failed to process folder contents. Please try again.');
      setUploadStatus('error');
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFolderContents(files);
    }
  };

  const updateSongMetadata = (index: number, field: keyof SongWithImage, value: string | number) => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateFileUpload = async (file: File): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
  };

  const handleFinalUpload = async () => {
    if (songs.length === 0) {
      setErrorMessage('No songs to upload.');
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
        const audioFileUrl = await simulateFileUpload(song.audioFile.file);
        
        // Get image URL if available
        let albumArtUrl = '';
        if (song.imageFile) {
          // In a real app, you would upload the image file here
          albumArtUrl = URL.createObjectURL(song.imageFile.file);
        }
        
        // Create song record in CMS
        const newSong: Partial<Songs> = {
          _id: crypto.randomUUID(),
          title: song.title,
          artistName: song.artist || 'Unknown Artist',
          albumName: song.album || folderData.folderName,
          genre: song.genre,
          duration: song.duration,
          albumArt: albumArtUrl || undefined,
          audioFile: audioFileUrl,
          uploadedBy: member?.loginEmail || (member as any)?._id || 'unknown',
          uploadDate: new Date(),
          releaseDate: new Date(),
          spotifyTrackId: undefined
        };

        await BaseCrudService.create('songs', newSong as any);
      }
      
      setUploadProgress(100);
      setUploadStatus('success');
      
      setTimeout(() => {
        navigate('/my-music');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload songs. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSongs([]);
    setFolderData({
      folderName: '',
      totalFiles: 0,
      audioFiles: 0,
      imageFiles: 0,
      matchedPairs: 0
    });
    setCurrentStep('upload');
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-deep-space-blue text-foreground py-12">
      <div className="max-w-6xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-teal font-heading mb-2 flex items-center">
            <FolderOpen className="h-8 w-8 mr-3" />
            Upload Folder
          </h1>
          <p className="text-foreground/70 font-paragraph">
            Upload an entire folder containing music files and images with automatic matching
          </p>
          <div className="mt-4 flex space-x-4">
            <Link to="/upload" className="text-secondary hover:underline font-paragraph text-sm">
              Upload single song
            </Link>
            <Link to="/upload-album" className="text-secondary hover:underline font-paragraph text-sm">
              Upload album
            </Link>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['upload', 'review', 'final'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === step ? 'bg-neon-teal text-black' :
                  ['upload', 'review', 'final'].indexOf(currentStep) > index ? 'bg-neon-teal/20 text-neon-teal' :
                  'bg-white/10 text-foreground/50'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && <div className="w-12 h-0.5 bg-white/20 mx-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-16 text-sm font-paragraph">
            <span className={currentStep === 'upload' ? 'text-neon-teal' : 'text-foreground/50'}>Select Folder</span>
            <span className={currentStep === 'review' ? 'text-neon-teal' : 'text-foreground/50'}>Review & Match</span>
            <span className={currentStep === 'final' ? 'text-neon-teal' : 'text-foreground/50'}>Upload</span>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <Alert className="border-green-500 bg-green-500/10 mb-6">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500 font-paragraph">
              Folder uploaded successfully! Redirecting to your music library...
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
                  <span>{isUploading ? 'Uploading songs...' : 'Processing folder...'}</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Folder Selection */}
        {currentStep === 'upload' && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neon-teal font-heading flex items-center">
                <FolderOpen className="h-5 w-5 mr-2" />
                Select Music Folder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div 
                  className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-neon-teal/50 transition-colors cursor-pointer"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: "" } as any)}
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                  <FolderOpen className="h-16 w-16 text-neon-teal mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                    Click to select a folder
                  </h3>
                  <p className="text-foreground/70 font-paragraph mb-4">
                    Choose a folder containing music files and album artwork
                  </p>
                  <p className="text-foreground/50 text-sm font-paragraph">
                    Supported: MP3, WAV, FLAC, M4A + JPG, PNG images
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h4 className="font-semibold text-foreground font-heading mb-4 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    How Image Matching Works
                  </h4>
                  <div className="space-y-3 text-sm font-paragraph text-foreground/70">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-neon-teal rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Exact name match:</strong> "Song.mp3" matches "Song.jpg"</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-neon-teal rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Partial match:</strong> "Artist - Song.mp3" matches "Artist - Song.png"</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-neon-teal rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Album artwork:</strong> Files named "cover", "artwork", "album", or "folder" will be matched to songs in the same directory</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review and Match */}
        {currentStep === 'review' && (
          <>
            {/* Folder Summary */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-neon-teal font-heading flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Folder: {folderData.folderName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-teal font-heading">{folderData.totalFiles}</div>
                    <div className="text-sm text-foreground/70 font-paragraph">Total Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-teal font-heading">{folderData.audioFiles}</div>
                    <div className="text-sm text-foreground/70 font-paragraph">Audio Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-teal font-heading">{folderData.imageFiles}</div>
                    <div className="text-sm text-foreground/70 font-paragraph">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-teal font-heading">{folderData.matchedPairs}</div>
                    <div className="text-sm text-foreground/70 font-paragraph">Matched Pairs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Songs Review */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-neon-teal font-heading flex items-center justify-between">
                  <div className="flex items-center">
                    <Music className="h-5 w-5 mr-2" />
                    Review Songs ({songs.length} found)
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={resetUpload} size="sm">
                      Start Over
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep('final')}
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant={song.matched ? "default" : "outline"} className={song.matched ? "bg-neon-teal text-black" : "border-orange-500 text-orange-400"}>
                          {song.matched ? 'Matched' : 'No Image'}
                        </Badge>
                        <div className="flex items-center text-sm text-foreground/70 font-paragraph">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(song.duration)}
                        </div>
                        <div className="flex items-center text-sm text-foreground/70 font-paragraph">
                          <FileAudio className="h-3 w-3 mr-1" />
                          {formatFileSize(song.audioFile.size)}
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Audio File Info */}
                      <div className="lg:col-span-2">
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
                            <div>
                              <Label className="text-foreground font-paragraph text-sm">Album</Label>
                              <Input
                                value={song.album}
                                onChange={(e) => updateSongMetadata(index, 'album', e.target.value)}
                                className="bg-white/5 border-white/20 text-foreground font-paragraph mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-foreground font-paragraph text-sm">Genre</Label>
                              <Input
                                value={song.genre || ''}
                                onChange={(e) => updateSongMetadata(index, 'genre', e.target.value)}
                                className="bg-white/5 border-white/20 text-foreground font-paragraph mt-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-semibold text-foreground font-heading">{song.title}</h4>
                            <p className="text-foreground/70 font-paragraph">{song.artist || 'Unknown Artist'}</p>
                            <p className="text-foreground/50 text-sm font-paragraph">{song.audioFile.name}</p>
                            {song.album && <p className="text-foreground/50 text-sm font-paragraph">Album: {song.album}</p>}
                          </div>
                        )}
                      </div>

                      {/* Image Preview */}
                      <div className="flex justify-center lg:justify-end">
                        {song.imageFile ? (
                          <div className="text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-lg border border-white/10 mb-2 flex items-center justify-center overflow-hidden">
                              <Image
                                src={URL.createObjectURL(song.imageFile.file)}
                                alt={`Album art for ${song.title}`}
                                className="w-full h-full object-cover"
                                width={96}
                              />
                            </div>
                            <p className="text-xs text-foreground/50 font-paragraph">{song.imageFile.name}</p>
                            <div className="flex items-center justify-center text-xs text-neon-teal font-paragraph mt-1">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Matched
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-lg border border-white/10 mb-2 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-foreground/30" />
                            </div>
                            <p className="text-xs text-foreground/50 font-paragraph">No image found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Final Upload */}
        {currentStep === 'final' && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neon-teal font-heading flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Ready to Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
                <h4 className="font-semibold text-foreground font-heading mb-4">Upload Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-paragraph">
                  <div>
                    <span className="text-foreground/70">Songs to upload:</span>
                    <div className="text-neon-teal font-semibold">{songs.length}</div>
                  </div>
                  <div>
                    <span className="text-foreground/70">With album art:</span>
                    <div className="text-neon-teal font-semibold">{songs.filter(s => s.matched).length}</div>
                  </div>
                  <div>
                    <span className="text-foreground/70">Total duration:</span>
                    <div className="text-neon-teal font-semibold">
                      {formatDuration(songs.reduce((total, song) => total + song.duration, 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-foreground/70">Folder:</span>
                    <div className="text-neon-teal font-semibold">{folderData.folderName}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('review')}
                  className="border-white/20 text-foreground hover:bg-white/5"
                >
                  Back to Review
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
                    disabled={isUploading || songs.length === 0}
                    className="bg-neon-teal text-black hover:bg-neon-teal/90 font-paragraph"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${songs.length} Songs`}
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