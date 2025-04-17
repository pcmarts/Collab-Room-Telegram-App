/**
 * Supabase Storage Utility Functions
 * 
 * This module provides utility functions for interacting with Supabase storage,
 * allowing file uploads, retrievals, and deletion while handling common edge cases
 * such as missing credentials or network issues.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { logger } from '../server/utils/logger';

// Constants
const BUCKET_NAME = 'profile-data';
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB
const REQUIRED_ENVIRONMENT_VARIABLES = ['SUPABASE_URL', 'SUPABASE_KEY'];

// File categories and their corresponding paths
const CATEGORY_PATHS = {
  'profile': 'profiles',
  'company_logo': 'companies/logos',
  'collaboration_attachment': 'collaborations/attachments',
  'message_attachment': 'messages/attachments',
  'document': 'documents'
};

// Initialize Supabase client if environment variables are available
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: any = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('Supabase storage client initialized successfully');
  } else {
    logger.warn('Supabase environment variables missing. Storage features will be unavailable.');
    logger.warn(`Missing variables: ${REQUIRED_ENVIRONMENT_VARIABLES.filter(v => !process.env[v]).join(', ')}`);
  }
} catch (error) {
  logger.error('Failed to initialize Supabase client:', error);
}

/**
 * Check if Supabase storage is properly configured
 * @returns {boolean} True if Supabase is configured, false otherwise
 */
function isConfigured(): boolean {
  return !!supabase;
}

/**
 * Generate a unique file path for uploading to Supabase
 * @param {File} file - The file object
 * @param {string} userId - The user ID
 * @param {string} category - The file category
 * @returns {string} The generated file path
 */
function generateFilePath(file: File, userId: string, category: string): string {
  // Get category folder or default to 'misc'
  const categoryFolder = CATEGORY_PATHS[category as keyof typeof CATEGORY_PATHS] || 'misc';
  
  // Generate UUID for file to ensure uniqueness
  const fileUuid = randomUUID();
  
  // Extract file extension
  const fileExtension = file.name.split('.').pop() || '';
  
  // Sanitize original filename and limit its length
  const sanitizedName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .substring(0, 30);
  
  // Construct path: category/userId/uuid-sanitizedName.extension
  return `${categoryFolder}/${userId}/${fileUuid}-${sanitizedName}.${fileExtension}`;
}

/**
 * Upload a file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} filePath - The path where the file should be stored
 * @param {string} userId - The user ID of the uploader
 * @returns {Promise<string|null>} The public URL of the uploaded file or null on failure
 */
async function uploadFile(file: File, filePath: string, userId: string): Promise<string | null> {
  if (!isConfigured()) {
    logger.error('Supabase storage not configured. Cannot upload file.');
    return null;
  }
  
  try {
    // Check file size
    if (file.size > MAX_UPLOAD_SIZE) {
      logger.error(`File too large (${file.size} bytes). Max size: ${MAX_UPLOAD_SIZE} bytes`);
      return null;
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      logger.error('Error uploading file to Supabase:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return urlData?.publicUrl || null;
  } catch (error) {
    logger.error('Exception during file upload:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise
 */
async function deleteFile(filePath: string): Promise<boolean> {
  if (!isConfigured()) {
    logger.error('Supabase storage not configured. Cannot delete file.');
    return false;
  }
  
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      logger.error('Error deleting file from Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Exception during file deletion:', error);
    return false;
  }
}

/**
 * Get the public URL for a file in Supabase storage
 * @param {string} filePath - The path of the file
 * @returns {string|null} The public URL or null if not configured
 */
function getPublicUrl(filePath: string): string | null {
  if (!isConfigured()) {
    logger.error('Supabase storage not configured. Cannot get public URL.');
    return null;
  }
  
  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data?.publicUrl || null;
  } catch (error) {
    logger.error('Exception getting public URL:', error);
    return null;
  }
}

// Export functions
export const supabaseStorage = {
  isConfigured,
  uploadFile,
  deleteFile,
  getPublicUrl,
  generateFilePath
};