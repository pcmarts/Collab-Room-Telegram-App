import { supabase } from './supabase';

// Bucket name for user uploads
const PROFILE_DATA_BUCKET = 'profile-data';

/**
 * Utility functions for interacting with Supabase Storage
 */
export const supabaseStorage = {
  /**
   * Upload a file to Supabase Storage
   * 
   * @param file File to upload
   * @param path Path within the bucket to store the file
   * @param userId User ID to associate with the file (for access control)
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: File, path: string, userId: string): Promise<string | null> {
    try {
      // Create a unique filename using timestamp and original filename
      const timestamp = new Date().getTime();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniquePath = `${path}/${userId}/${timestamp}_${cleanFileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(PROFILE_DATA_BUCKET)
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });
      
      if (error) {
        console.error('Error uploading file to Supabase:', error);
        throw error;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(PROFILE_DATA_BUCKET)
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      return null;
    }
  },
  
  /**
   * Delete a file from Supabase Storage
   * 
   * @param path Full path to the file in the bucket
   * @returns True if deletion was successful
   */
  async deleteFile(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(PROFILE_DATA_BUCKET)
        .remove([path]);
      
      if (error) {
        console.error('Error deleting file from Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  },
  
  /**
   * List all files in a directory
   * 
   * @param path Directory path to list
   * @returns Array of files or null if error
   */
  async listFiles(path: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.storage
        .from(PROFILE_DATA_BUCKET)
        .list(path);
      
      if (error) {
        console.error('Error listing files from Supabase:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('File listing failed:', error);
      return null;
    }
  }
};