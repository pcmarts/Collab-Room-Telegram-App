/**
 * SquareImageCropper Component
 * 
 * A specialized component for uploading company logos that will be displayed in 
 * circular avatars across the platform.
 * 
 * Features:
 * - Image upload with drag & drop support
 * - Circular display preview
 * - Integration with the file upload API
 */

"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Upload, ImagePlus, Save, X } from 'lucide-react'
import { useFileUpload, type FileUploadPayload } from '@/hooks/use-file-uploads'

interface SquareImageCropperProps {
  onUploadComplete: (fileUrl: string) => void
  initialImageUrl?: string
  userId: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

// Default size if not specified
const DEFAULT_SIZE = 'md'

// Size dimensions in pixels
const SIZES = {
  sm: 200,
  md: 300,
  lg: 400
}

export function SquareImageCropper({
  onUploadComplete,
  initialImageUrl,
  userId,
  size = DEFAULT_SIZE,
  label = 'Upload Logo',
  className = ''
}: SquareImageCropperProps) {
  const { toast } = useToast()
  const [imgSrc, setImgSrc] = useState<string>(initialImageUrl || '')
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const fileUpload = useFileUpload()
  const [dragOver, setDragOver] = useState(false)
  
  // Function to convert a File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Update circular preview whenever the image source changes
  useEffect(() => {
    if (imgSrc && canvasRef.current && imgRef.current) {
      const img = imgRef.current
      
      // Wait for the image to load
      const onLoad = () => {
        renderCircularPreview()
      }
      
      img.addEventListener('load', onLoad)
      
      return () => {
        img.removeEventListener('load', onLoad)
      }
    }
  }, [imgSrc])
  
  // Render circular preview
  const renderCircularPreview = () => {
    if (!canvasRef.current || !imgRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    const img = imgRef.current
    
    // Size the canvas (square)
    const previewSize = SIZES[size] / 3
    canvas.width = previewSize
    canvas.height = previewSize
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Calculate dimensions to maintain aspect ratio
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight
    const scale = Math.max(previewSize / imgWidth, previewSize / imgHeight)
    
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    
    // Center the image
    const x = (previewSize - scaledWidth) / 2
    const y = (previewSize - scaledHeight) / 2
    
    // Create circular clipping path
    ctx.beginPath()
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    
    // Draw the image centered
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
  }

  // Handle file selection from input
  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive'
        })
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB.',
          variant: 'destructive'
        })
        return
      }

      try {
        const base64 = await fileToBase64(file)
        setImgSrc(base64)
      } catch (error) {
        console.error('Error converting file to base64:', error)
        toast({
          title: 'Error processing image',
          description: 'There was a problem loading your image. Please try again.',
          variant: 'destructive'
        })
      }
      
      // Reset file input
      e.target.value = ''
    }
  }, [toast])

  // Handle save button click
  const handleSaveImage = useCallback(async () => {
    try {
      if (!imgSrc) {
        toast({
          title: 'No image selected',
          description: 'Please select an image first.',
          variant: 'destructive'
        })
        return
      }

      setIsUploading(true)
      
      // Create a circular version of the image using canvas
      const canvas = document.createElement('canvas')
      const size = 512 // Fixed size for upload
      canvas.width = size
      canvas.height = size
      
      const ctx = canvas.getContext('2d')
      if (!ctx || !imgRef.current) {
        throw new Error('Failed to create image context')
      }
      
      // Create a circular clipping path
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      
      // Calculate scaling to fit the image proportionally
      const img = imgRef.current
      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight
      const scale = Math.max(size / imgWidth, size / imgHeight)
      
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      // Center the image
      const x = (size - scaledWidth) / 2
      const y = (size - scaledHeight) / 2
      
      // Draw the image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      
      // Get the image data
      const imageData = canvas.toDataURL('image/png')
      
      // Generate a filename with timestamp to avoid duplicates
      const timestamp = new Date().getTime()
      const fileName = `company_logo_${timestamp}.png`
      
      // Get blob size for the fileSize field
      const response = await fetch(imageData)
      const blob = await response.blob()
      const fileSize = blob.size.toString()
      
      // Upload the file using our hook
      const uploadResponse = await fileUpload.uploadFile({
        fileData: imageData,
        fileName,
        fileType: 'image/png',
        fileSize,
        category: 'company_logo',
        relatedId: userId,
        relatedType: 'user'
      })
      
      if (uploadResponse && uploadResponse.public_url) {
        // Call the callback with the URL
        onUploadComplete(uploadResponse.public_url)
        
        // Show success message
        toast({
          title: 'Logo uploaded',
          description: 'Your company logo has been updated.',
          variant: 'default'
        })
      } else {
        throw new Error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error during image save:', error)
      toast({
        title: 'Upload failed',
        description: 'There was a problem uploading your logo. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }, [imgSrc, userId, fileUpload, onUploadComplete, toast])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: 'Please drop an image file.',
            variant: 'destructive'
          })
          return
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: 'Please select an image under 5MB.',
            variant: 'destructive'
          })
          return
        }

        try {
          const base64 = await fileToBase64(file)
          setImgSrc(base64)
        } catch (error) {
          console.error('Error converting file to base64:', error)
          toast({
            title: 'Error processing image',
            description: 'There was a problem loading your image. Please try again.',
            variant: 'destructive'
          })
        }
      }
    },
    [toast]
  )

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {!imgSrc ? (
            // Upload area - shown when no image is selected
            <div
              className={`border-2 border-dashed ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'} rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('logo-upload')?.click()}
              style={{
                width: '100%',
                height: `${SIZES[size]}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ImagePlus size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium mb-1">{label}</p>
              <p className="text-xs text-gray-500 mb-4">Drag & drop or click to browse</p>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Browse Files
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
            </div>
          ) : (
            // Image preview and controls
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                {/* Image preview */}
                <div className="relative" style={{ width: `${SIZES[size]}px`, height: `${SIZES[size]}px` }}>
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    style={{ maxHeight: `${SIZES[size]}px` }}
                  />
                </div>
                
                {/* Circular preview */}
                <div className="flex flex-col items-center">
                  <h4 className="text-sm font-medium mb-2">Circular Preview</h4>
                  <canvas
                    ref={canvasRef}
                    className="rounded-full shadow-md bg-gray-100"
                    style={{
                      width: `${SIZES[size] / 3}px`,
                      height: `${SIZES[size] / 3}px`
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">Your logo will appear like this</p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImgSrc('')}
                  disabled={isUploading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}