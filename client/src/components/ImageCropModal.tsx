import { useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
}

export function ImageCropModal({ open, onClose, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;
    
    // Make the canvas size a square based on the larger dimension
    const size = Math.max(crop.width, crop.height);
    canvas.width = size * scaleX * pixelRatio;
    canvas.height = size * scaleY * pixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = (crop.x * scaleX);
    const cropY = (crop.y * scaleY);
    const cropWidth = (crop.width * scaleX);
    const cropHeight = (crop.height * scaleY);

    // Force square aspect ratio
    const outputSize = Math.min(cropWidth, cropHeight);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 1);
    });
  };

  const handleComplete = async () => {
    if (!imageRef || !crop.width || !crop.height) return;
    
    try {
      setIsProcessing(true);
      const croppedImageUrl = await getCroppedImg(imageRef, crop);
      onCropComplete(croppedImageUrl);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Logo</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            className="max-h-[60vh] mx-auto"
          >
            <img
              src={imageSrc}
              ref={(e) => setImageRef(e)}
              alt="Crop preview"
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Apply Crop'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
