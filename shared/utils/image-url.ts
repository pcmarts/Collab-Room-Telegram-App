/**
 * Utility functions for handling image URLs
 */

// Use the hardcoded URL since this is a public URL anyway and environment variables 
// might not be available on the client side
const SUPABASE_URL = 'https://gunifdyywvzgntaubezl.supabase.co';
const SUPABASE_STORAGE_BUCKET = 'logos';

/**
 * Convert a logo filename or path to a full Supabase public URL
 */
export function getSupabaseImageUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // If it's a local path like '/company-logos/filename.jpg', extract just the filename
  let filename = logoPath;
  if (logoPath.startsWith('/company-logos/')) {
    filename = logoPath.replace('/company-logos/', '');
  } else if (logoPath.startsWith('/')) {
    filename = logoPath.substring(1);
  }
  
  // Construct the Supabase public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filename}`;
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