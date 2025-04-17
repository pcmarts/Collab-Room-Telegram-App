import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, File, Trash2, Download, Image, FileText, FileArchive, Music, Video, AlertCircle } from "lucide-react";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileListProps {
  // Optional related entity ID for filtering files
  relatedId?: string;
  
  // Optional user ID - defaults to current user
  userId?: string;
  
  // Optional filter by category
  category?: string;
  
  // Optional empty state message
  emptyMessage?: string;
  
  // Optional className
  className?: string;
}

export function FileList({
  relatedId,
  userId,
  category,
  emptyMessage = "No files found",
  className = "",
}: FileListProps) {
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  
  const {
    files,
    isLoading,
    isError,
    deleteFile,
    isDeleting,
    isStorageAvailable,
    storageStatus,
  } = useFileUploads({ userId, relatedId });
  
  // Helper function to get icon based on file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5" />;
    } else if (mimeType.startsWith("text/")) {
      return <FileText className="h-5 w-5" />;
    } else if (mimeType.startsWith("audio/")) {
      return <Music className="h-5 w-5" />;
    } else if (mimeType.startsWith("video/")) {
      return <Video className="h-5 w-5" />;
    } else if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) {
      return <FileArchive className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };
  
  // Filter files by category if provided
  const filteredFiles = files && category 
    ? files.filter(file => file.category === category)
    : files;
  
  // Handle file deletion
  const handleDeleteFile = (fileId: string) => {
    deleteFile(fileId);
    setFileToDelete(null);
  };
  
  // If storage is not available
  if (!isStorageAvailable) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <span>File storage is not available: {storageStatus?.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load files. Please try again.</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!filteredFiles || filteredFiles.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <File className="h-5 w-5" />
            <span>{emptyMessage}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {filteredFiles.map((file) => (
        <Card key={file.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {getFileIcon(file.mime_type)}
                <div className="overflow-hidden">
                  <div className="font-medium text-sm truncate">{file.filename}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{formatFileSize(file.size_bytes)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={file.public_url} target="_blank" rel="noopener noreferrer" download={file.filename}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </a>
                </Button>
                
                <AlertDialog open={fileToDelete === file.id} onOpenChange={(open) => !open && setFileToDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setFileToDelete(file.id)}
                    >
                      {isDeleting && fileToDelete === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.filename}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteFile(file.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting && fileToDelete === file.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>Delete</>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}