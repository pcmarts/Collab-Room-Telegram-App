import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

export interface FileUploadResult {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  public_url: string;
  size_bytes: number;
  mime_type: string;
  category: string;
  related_id?: string;
  related_type?: string;
  created_at: Date;
}

export interface FileUploadError {
  message: string;
  error?: any;
}

export interface FileUploadOptions {
  category: 'profile' | 'company_logo' | 'collaboration_attachment' | 'message_attachment' | 'document';
  relatedId?: string;
  relatedType?: string;
  showToasts?: boolean;
}

interface FileUploadHookOptions {
  userId?: string;
  relatedId?: string;
  category?: string;
}

export function useFileUpload(options?: FileUploadHookOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<FileUploadResult | null>(null);
  const [error, setError] = useState<FileUploadError | null>(null);
  const [storageStatus, setStorageStatus] = useState<{ available: boolean; message?: string }>({ 
    available: false,
    message: 'Checking storage status...'
  });
  const { toast } = useToast();
  
  // Fetch files based on options
  const filesQuery = useQuery({
    queryKey: ['files', options?.userId, options?.relatedId, options?.category],
    queryFn: async () => {
      let url = '/api/files';
      const params = new URLSearchParams();
      
      if (options?.userId) params.append('userId', options.userId);
      if (options?.relatedId) params.append('relatedId', options.relatedId);
      if (options?.category) params.append('category', options.category);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      return apiRequest(url, 'GET');
    },
    enabled: Boolean(storageStatus.available)
  });
  
  // Check if storage is available on mount
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const status = await checkFileStorageStatus();
        setStorageStatus({ 
          available: status,
          message: status ? undefined : 'Storage service is not available'
        });
      } catch (err) {
        setStorageStatus({ 
          available: false,
          message: 'Failed to connect to storage service'
        });
      }
    };
    
    checkStorage();
  }, []);

  /**
   * Upload a file using Base64 data
   */
  const uploadBase64File = async (
    base64Data: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    options: FileUploadOptions
  ): Promise<FileUploadResult | null> => {
    try {
      setIsUploading(true);
      setError(null);

      const uploadData = {
        fileData: base64Data,
        fileName,
        fileType,
        fileSize,
        category: options.category,
        relatedId: options.relatedId,
        relatedType: options.relatedType
      };

      const response = await apiRequest('/api/files/upload', 'POST', uploadData);
      
      if (response) {
        setLastUploadedFile(response);
        
        if (options.showToasts) {
          toast({
            title: 'File uploaded successfully',
            description: `${fileName} has been uploaded.`,
            duration: 3000
          });
        }
        
        return response;
      }
      
      throw new Error('Failed to upload file: No response from server');
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during file upload';
      
      setError({
        message: errorMessage,
        error: err
      });
      
      if (options.showToasts) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: errorMessage,
          duration: 5000
        });
      }
      
      console.error('File upload error:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Delete a file by ID
   */
  const deleteFile = async (fileId: string, showToast = true): Promise<boolean> => {
    try {
      setIsUploading(true);
      setError(null);

      await apiRequest(`/api/files/${fileId}`, 'DELETE');
      
      if (showToast) {
        toast({
          title: 'File deleted',
          description: 'The file has been successfully deleted.',
          duration: 3000
        });
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred while deleting the file';
      
      setError({
        message: errorMessage,
        error: err
      });
      
      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: errorMessage,
          duration: 5000
        });
      }
      
      console.error('File deletion error:', err);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Upload a company logo
   */
  const uploadCompanyLogo = async (
    base64Data: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    showToast = true
  ): Promise<FileUploadResult | null> => {
    return uploadBase64File(
      base64Data,
      fileName,
      fileType,
      fileSize,
      {
        category: 'company_logo',
        showToasts: showToast
      }
    );
  };

  /**
   * Check if file storage is available
   */
  const checkFileStorageStatus = async (): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/files/status', 'GET');
      return response?.status === 'available';
    } catch (err) {
      console.error('Error checking file storage status:', err);
      return false;
    }
  };

  return {
    // File data and state
    files: filesQuery.data,
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    
    // Upload methods
    uploadBase64File,
    uploadCompanyLogo,
    
    // Delete methods
    deleteFile,
    isDeleting,
    
    // Storage status
    checkFileStorageStatus,
    isStorageAvailable: storageStatus.available,
    storageStatus,
    
    // General state
    isUploading,
    lastUploadedFile,
    error
  };
}