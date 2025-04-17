import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, File, X, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { fileUploadSchema, type FileUploadData, FILE_CATEGORIES } from "@shared/schema";

interface FileUploadProps {
  category: typeof FILE_CATEGORIES[number];
  relatedId?: string;
  relatedType?: string;
  onUploadComplete?: (fileData: any) => void;
  onUploadError?: (error: any) => void;
  allowedFileTypes?: string[];
  maxSizeMB?: number;
  buttonLabel?: string;
  className?: string;
}

export function FileUpload({
  category,
  relatedId,
  relatedType,
  onUploadComplete,
  onUploadError,
  allowedFileTypes,
  maxSizeMB = 10,
  buttonLabel = "Upload File",
  className = "",
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Max file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Reset the file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validate file type if allowedFileTypes is provided
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      const fileType = file.type;
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      
      const isValidType = allowedFileTypes.some(type => {
        // Check if the allowed type is a MIME type (with /) or an extension
        if (type.includes("/")) {
          return fileType === type || fileType.startsWith(`${type.split("/")[0]}/`);
        } else {
          return fileExtension === type.toLowerCase();
        }
      });
      
      if (!isValidType) {
        setUploadError(`Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`);
        resetFileInput();
        return;
      }
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      setUploadError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      resetFileInput();
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
  };
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { fileData: string; fileName: string; fileType: string; fileSize: number }) => {
      try {
        // Configure the upload API request
        const uploadData = {
          fileData: data.fileData,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          category: category,
          relatedId: relatedId,
          relatedType: relatedType
        };
        
        // Upload the file using base64 encoding
        const response = await apiRequest("/api/files/upload", "POST", uploadData);
        
        return response;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Reset the file input
      resetFileInput();
      
      // Show success toast
      toast({
        title: "Upload Successful",
        description: "Your file has been uploaded successfully.",
        variant: "default",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      if (relatedId) {
        queryClient.invalidateQueries({ queryKey: ["/api/files/related", relatedId] });
      }
      
      // Call onUploadComplete callback if provided
      if (onUploadComplete) {
        onUploadComplete(data);
      }
      
      setUploadProgress(100);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setUploadError("Upload failed. Please try again.");
      
      // Show error toast
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      
      // Call onUploadError callback if provided
      if (onUploadError) {
        onUploadError(error);
      }
      
      setUploadProgress(0);
    },
  });
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    
    try {
      setUploadError(null);
      setUploadProgress(10);
      
      // Read the file as a data URL (base64)
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          setUploadError("Error reading file.");
          return;
        }
        
        setUploadProgress(30);
        
        // Get the base64 data URL
        const fileData = event.target.result as string;
        
        // Upload the file
        uploadMutation.mutate({
          fileData,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size
        });
        
        setUploadProgress(50);
      };
      
      reader.onerror = () => {
        setUploadError("Error reading file. Please try again.");
        setUploadProgress(0);
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error during upload:", error);
      setUploadError("An unexpected error occurred. Please try again.");
      setUploadProgress(0);
    }
  };
  
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file-upload" className="text-sm font-medium">
          {buttonLabel}
        </Label>
        
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="max-w-sm"
            aria-describedby="file-upload-description"
            disabled={uploadMutation.isPending}
          />
          
          {selectedFile && !uploadMutation.isPending && (
            <Button
              onClick={handleUpload}
              type="button"
              size="sm"
              className="gap-1"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          )}
          
          {selectedFile && !uploadMutation.isPending && (
            <Button
              onClick={resetFileInput}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {selectedFile && !uploadMutation.isPending && !uploadError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-4 w-4" />
          <span className="font-medium">Selected: </span>
          <span className="truncate max-w-[240px]">{selectedFile.name}</span>
          <span>({Math.round(selectedFile.size / 1024)} KB)</span>
        </div>
      )}
      
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {uploadError}
        </div>
      )}
      
      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 animate-pulse text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
        </div>
      )}
      
      {uploadMutation.isSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <Check className="h-4 w-4" />
          File uploaded successfully
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-1">
        {allowedFileTypes && (
          <div>Allowed types: {allowedFileTypes.join(", ")}</div>
        )}
        <div>Maximum size: {maxSizeMB}MB</div>
      </div>
    </div>
  );
}