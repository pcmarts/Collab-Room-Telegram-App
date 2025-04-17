import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Upload, X, Crop, Save, Loader2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SquareImageCropperProps {
  currentImageUrl?: string | null;
  categoryName?: string;
  onImageCropped: (data: { 
    base64Data: string; 
    filename: string; 
    mimeType: string; 
    size: number;
  }) => void;
  onError?: (error: Error) => void;
  isUploading?: boolean;
  maxSizeMB?: number;
  className?: string;
}

export function SquareImageCropper({
  currentImageUrl,
  categoryName = 'company_logo',
  onImageCropped,
  onError,
  isUploading = false,
  maxSizeMB = 5,
  className = ''
}: SquareImageCropperProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropSize, setCropSize] = useState<{ width: number; height: number }>({ width: 300, height: 300 });
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  
  // Max file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Effect to initialize preview with current image
  useEffect(() => {
    if (currentImageUrl && !previewUrl && !selectedFile) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl, previewUrl, selectedFile]);

  // Reset function
  const resetCropper = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsCropping(false);
    setErrorMessage(null);
    setScale(1);
    setCropPosition({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      setErrorMessage(`Image too large. Maximum size is ${maxSizeMB}MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setIsCropping(true);
    
    // Reset crop position and scale
    setCropPosition({ x: 0, y: 0 });
    setScale(1);
    
    // Clean up previous object URL if it exists
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  };

  // Handle image drag in crop mode
  const handleMouseDown = (startEvent: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping) return;
    
    startEvent.preventDefault();
    
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const startPosition = { ...cropPosition };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Apply drag movement to position
      setCropPosition({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle zoom/scale change
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };
  
  // Handle crop completion
  const handleCompleteCrop = () => {
    if (!canvasRef.current || !imageRef.current || !cropAreaRef.current) {
      setErrorMessage('Error: Could not process the image.');
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      const cropArea = cropAreaRef.current;
      
      // Get the dimensions of the crop area and image
      const cropRect = cropArea.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      // Calculate source rectangle (portion of source image to draw)
      // Need to map from screen coordinates to image coordinates
      const sourceX = (cropRect.left - imageRect.left - cropPosition.x) / scale;
      const sourceY = (cropRect.top - imageRect.top - cropPosition.y) / scale;
      const sourceWidth = cropRect.width / scale;
      const sourceHeight = cropRect.height / scale;
      
      // Set canvas dimensions to match the crop area
      canvas.width = cropSize.width;
      canvas.height = cropSize.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage('Error: Canvas context not available.');
        return;
      }
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a circular crop for Twitter-like profile pictures
      ctx.save();
      ctx.beginPath();
      // Create a circle in the middle of the canvas
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        Math.PI * 2
      );
      ctx.clip(); // Clip to the circle
      
      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        image,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Restore the context
      ctx.restore();
      
      // Get the base64 data URL of the cropped image
      const croppedImageData = canvas.toDataURL(selectedFile?.type || 'image/png');
      
      // Convert base64 to blob to get file size
      const byteString = atob(croppedImageData.split(',')[1]);
      const mimeType = croppedImageData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeType });
      const fileName = selectedFile 
        ? `cropped-${selectedFile.name}` 
        : `cropped-image.${mimeType.split('/')[1]}`;
      
      // Send the cropped image data to the parent component
      onImageCropped({
        base64Data: croppedImageData,
        filename: fileName,
        mimeType: mimeType,
        size: blob.size
      });
      
      // Update preview with cropped image and exit cropping mode
      setPreviewUrl(croppedImageData);
      setIsCropping(false);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      setErrorMessage('Failed to crop the image. Please try again.');
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };
  
  // Handle canceling crop
  const handleCancelCrop = () => {
    // If we have a current image, revert to it
    if (currentImageUrl && !selectedFile) {
      setPreviewUrl(currentImageUrl);
    } else {
      setPreviewUrl(null);
    }
    setIsCropping(false);
    setScale(1);
    setCropPosition({ x: 0, y: 0 });
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-2">
        <Label htmlFor="company-logo-upload">Company Logo</Label>
        <Input
          ref={fileInputRef}
          id="company-logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          Upload a logo for your company. The image will be displayed as a circular avatar.
          <br />Maximum size: {maxSizeMB}MB
        </p>
      </div>
      
      {/* Preview Area with circular display */}
      {previewUrl && (
        <Card className="relative overflow-hidden border border-border">
          <CardContent className="p-4 relative">
            {/* Circle preview when not cropping */}
            {!isCropping && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 mx-auto">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Company Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Building className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {previewUrl === currentImageUrl 
                    ? "Current logo (displays as a circle in the app)"
                    : "Preview (displays as a circle in the app)"}
                </p>
              </div>
            )}
            
            {/* Cropping interface */}
            {isCropping && (
              <div 
                className="relative mx-auto overflow-hidden cursor-move"
                style={{ 
                  width: '100%', 
                  height: '300px',
                  maxWidth: '500px',
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Main image for cropping */}
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="absolute"
                  style={{
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    maxWidth: 'none'
                  }}
                />
                
                {/* Crop overlay with circle */}
                <>
                  {/* Darkened areas */}
                  <div className="absolute inset-0 bg-black/50"></div>
                  
                  {/* Circular crop window */}
                  <div
                    ref={cropAreaRef}
                    className="absolute bg-transparent border-2 border-white rounded-full"
                    style={{
                      width: `${cropSize.width}px`,
                      height: `${cropSize.height}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                  ></div>
                </>
              </div>
            )}
            
            {/* Cropping controls */}
            {isCropping && (
              <div className="p-4 space-y-4 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="scale-slider">Zoom</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">1x</span>
                    <input
                      id="scale-slider"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={scale}
                      onChange={handleScaleChange}
                      className="flex-1"
                    />
                    <span className="text-xs">3x</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelCrop}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleCompleteCrop}
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Crop & Save
                  </Button>
                </div>
              </div>
            )}
            
            {/* Controls when not cropping */}
            {!isCropping && (
              <div className="p-4 flex flex-wrap gap-2 justify-between items-center">
                <div>
                  {previewUrl === currentImageUrl ? (
                    <p className="text-sm text-muted-foreground">Current company logo</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Preview of new logo</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {previewUrl !== currentImageUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetCropper}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                  
                  {selectedFile && !isCropping && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setIsCropping(true)}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Adjust Crop
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}