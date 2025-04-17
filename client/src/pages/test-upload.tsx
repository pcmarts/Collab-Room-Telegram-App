import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FileList } from "@/components/ui/file-list";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Function to convert URL to File object
const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};

export default function TestUploadPage() {
  const [, navigate] = useLocation();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const handleUploadComplete = (fileData: any) => {
    console.log("Upload complete:", fileData);
    setUploadedFile(fileData);
  };
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { 
      base64Data: string, 
      filename: string, 
      mimeType: string, 
      size: number, 
      category: string 
    }) => {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `File ${data.filename} has been uploaded`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      setUploadedFile(data);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });
  
  // Create a mock user session for testing purposes
  const createMockUserSession = async () => {
    try {
      // Make a request to create a test session
      const response = await fetch('/api/test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Using a fixed test user ID for consistent testing
          userId: '00000000-0000-0000-0000-000000000001',
          username: 'test-user',
          isAdmin: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test session');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to create a test session. Upload functionality may not work.",
        variant: "destructive",
      });
    }
  };
  
  // Function to upload a sample image from the assets
  const uploadSampleImage = async () => {
    try {
      setIsUploading(true);
      
      // Ensure we have a test session first
      await createMockUserSession();
      
      // Use one of the images from attached_assets
      const imageUrl = '/THE COLLAB ROOM small.jpg'; // Path to the image in public folder
      const file = await urlToFile(imageUrl, 'collab-room-logo.jpg', 'image/jpeg');
      
      // Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Upload the file
      uploadMutation.mutate({
        base64Data,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        category: 'company_logo'
      });
    } catch (error) {
      console.error('Error uploading sample image:', error);
      toast({
        title: "Error preparing sample image",
        description: error instanceof Error ? error.message : "Failed to process the sample image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Test File Upload</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Twitter Profile Picture</CardTitle>
            <CardDescription>
              Upload your profile picture using the file upload component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              category="profile"
              buttonLabel="Twitter Profile Picture"
              allowedFileTypes={["image/jpeg", "image/png", "image/gif"]}
              maxSizeMB={5}
              onUploadComplete={handleUploadComplete}
            />
            
            {uploadedFile && (
              <div className="mt-4 p-4 border rounded-md">
                <h3 className="font-medium">Uploaded File Details:</h3>
                <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(uploadedFile, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Files</CardTitle>
            <CardDescription>
              List of all your uploaded profile images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button 
                onClick={uploadSampleImage} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading Sample Image..." : "Upload Sample Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will upload a sample company logo from the assets.
              </p>
            </div>
            
            <FileList 
              emptyMessage="No files uploaded yet"
              category="profile"
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}