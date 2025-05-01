/**
 * Image Downloader Utility
 * 
 * This module provides functions to download company logos from Twitter 
 * and save them to our public directory to avoid CORS issues
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the path to store images
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LOGOS_DIR = path.join(PUBLIC_DIR, 'company-logos');

// Ensure the directories exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }
}

/**
 * Download an image from a URL and save it to the local filesystem
 * 
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} companyId - The company ID to use in the filename
 * @returns {Promise<Object>} - Object with success status and local path or error
 */
async function downloadAndSaveImage(imageUrl, companyId) {
  if (!imageUrl) {
    return { success: false, error: 'No image URL provided' };
  }
  
  try {
    // Ensure directories exist
    ensureDirectoriesExist();
    
    // Parse the URL to get the file extension
    const urlParts = imageUrl.split('.');
    const fileExtension = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
    
    // Generate a filename based on company ID
    const filename = `${companyId}.${fileExtension}`;
    const filePath = path.join(LOGOS_DIR, filename);
    
    // Fetch the image
    console.log(`Downloading image from ${imageUrl}...`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Convert the response to a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save the image to disk
    fs.writeFileSync(filePath, buffer);
    
    // Construct the public URL path (relative to domain)
    const publicPath = `/company-logos/${filename}`;
    
    console.log(`Image saved to ${filePath} (public URL: ${publicPath})`);
    
    return {
      success: true,
      localPath: filePath,
      publicPath: publicPath
    };
  } catch (error) {
    console.error(`Error downloading and saving image:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

export {
  downloadAndSaveImage
};