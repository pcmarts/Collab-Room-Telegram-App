import { createClient } from '@supabase/supabase-js';

// Supabase client initialization 
// We've extracted this to a separate file to maintain consistency across all storage operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Initialize the Supabase client with proper error handling
let supabase: any = null;

// Function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseKey;
}

// Only create the client if we have the required credentials
if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl as string, supabaseKey as string);
    console.log('Supabase storage client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase credentials not provided. Storage features will be unavailable.');
}

// Default bucket name - this should match the bucket you've created in Supabase
const DEFAULT_BUCKET = 'profile-data';

/**
 * Utility functions for interacting with Supabase Storage
 */
export const supabaseStorage = {
  /**
   * Check if Supabase storage is configured
   * @returns True if Supabase is configured
   */
  isConfigured(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  },
  /**
   * Upload a file to Supabase Storage
   * 
   * @param file File to upload
   * @param path Path within the bucket to store the file
   * @param userId User ID to associate with the file (for access control)
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: File, path: string, userId: string): Promise<string | null> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Cannot upload file: Supabase is not configured. Please check your environment variables.');
      return null;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .upload(path, file, {
          upsert: true,
          // Add file metadata
          cacheControl: '3600', // Cache for 1 hour
          contentType: file.type, // Set the correct content type
        });

      if (error) {
        console.error('Error uploading file to Supabase:', error);
        return null;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(DEFAULT_BUCKET)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Exception in uploadFile:', error);
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
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Cannot delete file: Supabase is not configured. Please check your environment variables.');
      return false;
    }
    
    try {
      const { error } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .remove([path]);

      if (error) {
        console.error('Error deleting file from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteFile:', error);
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
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Cannot list files: Supabase is not configured. Please check your environment variables.');
      return null;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .list(path);

      if (error) {
        console.error('Error listing files in Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in listFiles:', error);
      return null;
    }
  },

  /**
   * Generate a unique file path for a given file and user
   * 
   * @param file The file being uploaded
   * @param userId The user's ID
   * @param category Optional category for organizing files
   * @returns A unique path for the file
   */
  generateFilePath(file: File, userId: string, category: string = 'general'): string {
    // Get the file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Generate a timestamp to ensure uniqueness
    const timestamp = Date.now();
    
    // Create a sanitized file name - replace spaces and special chars
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_')
      .replace(/_{2,}/g, '_');
    
    // Return path format: userId/category/timestamp_sanitizedName
    return `${userId}/${category}/${timestamp}_${sanitizedName}`;
  }
};