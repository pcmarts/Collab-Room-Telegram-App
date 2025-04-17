/**
 * useFileUpload Hook
 * 
 * This hook provides methods for working with the file upload API.
 * It handles uploading files, fetching file lists, and other file-related operations.
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface FileUploadPayload {
  fileData: string;       // Base64 encoded file data
  fileName: string;       // Original filename
  fileType: string;       // MIME type
  fileSize: string;       // Size in bytes
  category: 'profile' | 'company_logo' | 'collaboration_attachment' | 'message_attachment' | 'document';
  relatedId?: string;     // Optional ID of related entity (user, collaboration, etc.)
  relatedType?: string;   // Optional type of related entity
}

export interface FileUpload {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  public_url: string;
  size_bytes: number;
  mime_type: string;
  category: string;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
  metadata: {
    originalName: string;
    uploadDate: string;
    [key: string]: any;
  };
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for uploading a file
  const uploadFileMutation = useMutation({
    mutationFn: async (fileData: FileUploadPayload) => {
      setIsUploading(true);
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData),
      });
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate file queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onSettled: () => {
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'There was a problem uploading the file.',
        variant: 'destructive',
      });
    }
  });

  // Mutation for deleting a file
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'There was a problem deleting the file.',
        variant: 'destructive',
      });
    }
  });

  // Query for getting all files for the current user
  const useUserFiles = () => {
    return useQuery<FileUpload[]>({
      queryKey: ['/api/files'],
      queryFn: async () => {
        return apiRequest('/api/files');
      }
    });
  };

  // Query for getting files related to a specific entity
  const useRelatedFiles = (relatedId: string) => {
    return useQuery<FileUpload[]>({
      queryKey: ['/api/files/related', relatedId],
      queryFn: async () => {
        return apiRequest(`/api/files/related/${relatedId}`);
      },
      enabled: !!relatedId, // Only run query if relatedId is provided
    });
  };

  // Query to check if file storage is available
  const useFileStorageStatus = () => {
    return useQuery({
      queryKey: ['/api/files/status'],
      queryFn: async () => {
        return apiRequest('/api/files/status');
      }
    });
  };

  // Method to check for file storage availability
  const checkStorageAvailability = async (): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/files/status');
      return response.status === 'available';
    } catch (error) {
      return false;
    }
  };

  // Method to upload a file
  const uploadFile = async (fileData: FileUploadPayload): Promise<FileUpload | null> => {
    try {
      if (!fileData.fileData || !fileData.fileName || !fileData.fileType) {
        throw new Error('Missing required file information');
      }

      const isAvailable = await checkStorageAvailability();
      if (!isAvailable) {
        throw new Error('File storage is not available. Please check your Supabase configuration.');
      }

      const response = await uploadFileMutation.mutateAsync(fileData);
      return response as FileUpload;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'There was a problem uploading the file.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Method to delete a file
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await deleteFileMutation.mutateAsync(fileId);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    useUserFiles,
    useRelatedFiles,
    useFileStorageStatus,
    checkStorageAvailability,
    isUploading,
  };
}