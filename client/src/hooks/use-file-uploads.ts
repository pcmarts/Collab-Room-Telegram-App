import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UseFileUploadsOptions {
  // Optional user ID - defaults to current user
  userId?: string;
  
  // Optional related entity ID for filtering files
  relatedId?: string;
  
  // Enable/disable automatic fetching
  enabled?: boolean;
}

/**
 * Hook for fetching and managing file uploads
 */
export function useFileUploads(options: UseFileUploadsOptions = {}) {
  const { userId, relatedId, enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all files for current user
  const userFilesQuery = useQuery({
    queryKey: ["/api/files", userId],
    enabled: enabled && !relatedId,
    queryFn: async () => {
      const endpoint = userId ? `/api/files?userId=${userId}` : "/api/files";
      const response = await apiRequest(endpoint);
      return response;
    },
  });
  
  // Get files related to a specific entity
  const relatedFilesQuery = useQuery({
    queryKey: ["/api/files/related", relatedId],
    enabled: enabled && !!relatedId,
    queryFn: async () => {
      const response = await apiRequest(`/api/files/related/${relatedId}`);
      return response;
    },
  });
  
  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest(`/api/files/${fileId}`, "DELETE");
      return response;
    },
    onSuccess: (_, fileId) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      if (relatedId) {
        queryClient.invalidateQueries({ queryKey: ["/api/files/related", relatedId] });
      }
      
      // Show success toast
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting file:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Check storage status
  const storageStatusQuery = useQuery({
    queryKey: ["/api/files/status"],
    queryFn: async () => {
      const response = await apiRequest("/api/files/status");
      return response;
    },
    // Cache for longer since this doesn't change often
    gcTime: 1000 * 60 * 60, // 1 hour
  });
  
  // Helper to determine if features are available
  const isStorageAvailable = storageStatusQuery.data?.status === 'available';
  
  // Return combined data and functions
  return {
    // Queries
    files: relatedId ? relatedFilesQuery.data : userFilesQuery.data,
    isLoading: relatedId ? relatedFilesQuery.isLoading : userFilesQuery.isLoading,
    isError: relatedId ? relatedFilesQuery.isError : userFilesQuery.isError,
    error: relatedId ? relatedFilesQuery.error : userFilesQuery.error,
    storageStatus: storageStatusQuery.data,
    isStorageAvailable,
    
    // Mutations
    deleteFile: deleteFileMutation.mutate,
    isDeleting: deleteFileMutation.isPending,
    
    // For refetching
    refetch: relatedId ? relatedFilesQuery.refetch : userFilesQuery.refetch,
  };
}