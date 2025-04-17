import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FileList } from "@/components/ui/file-list";
import { useLocation } from "wouter";

export default function TestUploadPage() {
  const [_, navigate] = useLocation();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  
  const handleUploadComplete = (fileData: any) => {
    console.log("Upload complete:", fileData);
    setUploadedFile(fileData);
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
          </CardHeader>
          <CardContent>
            <FileList 
              emptyMessage="No files uploaded yet"
              category="profile"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}