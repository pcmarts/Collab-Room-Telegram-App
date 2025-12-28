/**
 * Utility functions for handling image URLs
 * 
 * CONFIGURATION:
 * Set VITE_SUPABASE_URL environment variable to your Supabase project URL
 * Set VITE_SUPABASE_STORAGE_BUCKET to your storage bucket name (defaults to 'logos')
 * 
 * If not configured, falls back to null (images won't load but UI remains functional)
 */

// Get Supabase URL from environment variable
// Returns null if not configured - callers should handle gracefully
function getSupabaseUrl(): string | null {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (typeof process !== 'undefined' && process.env?.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  return null;
}

const SUPABASE_STORAGE_BUCKET = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_STORAGE_BUCKET
  ? import.meta.env.VITE_SUPABASE_STORAGE_BUCKET
  : (typeof process !== 'undefined' && process.env?.SUPABASE_STORAGE_BUCKET) || 'logos';

/**
 * Convert a logo filename or path to a full Supabase public URL
 * Returns null if Supabase is not configured - callers should handle gracefully
 */
export function getSupabaseImageUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // Check if Supabase is configured
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    return null;
  }
  
  // If it's a local path like '/company-logos/filename.jpg', extract just the filename
  let filename = logoPath;
  if (logoPath.startsWith('/company-logos/')) {
    filename = logoPath.replace('/company-logos/', '');
  } else if (logoPath.startsWith('/')) {
    filename = logoPath.substring(1);
  }
  
  // Construct the Supabase public URL
  return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filename}`;
}

/**
 * Check if a URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('.supabase.co/storage/v1/object/public/');
}

/**
 * Get the optimized version of an image URL (if available)
 * For logos stored in Supabase, we can try to get HD or SD versions
 */
export function getOptimizedImageUrl(logoPath: string | null | undefined, size: 'hd' | 'sd' = 'hd'): string | null {
  const baseUrl = getSupabaseImageUrl(logoPath);
  if (!baseUrl) return null;
  
  // If the URL doesn't already have _hd or _sd suffix, try to add it
  if (!baseUrl.includes('_hd.') && !baseUrl.includes('_sd.')) {
    const optimizedUrl = baseUrl.replace(/\.(jpg|jpeg|png|webp)$/i, `_${size}.$1`);
    return optimizedUrl;
  }
  
  return baseUrl;
} 