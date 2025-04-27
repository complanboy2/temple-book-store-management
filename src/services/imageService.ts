import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a hash of the image file content combined with book metadata
 */
export const generateImageHash = async (file: File, metadata?: { author?: string, name?: string, printingInstitute?: string }): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        // Combine file content with book metadata for a more unique hash
        let contentToHash = e.target.result as string;
        
        // Add metadata to the hash if available
        if (metadata) {
          const metadataString = [
            metadata.author || '',
            metadata.name || '',
            metadata.printingInstitute || ''
          ].join('::');
          
          if (metadataString.trim().length > 0) {
            contentToHash += metadataString;
          }
        }
        
        // Create SHA-256 hash of the combined content
        const hashResult = CryptoJS.SHA256(contentToHash);
        const hash = hashResult.toString(CryptoJS.enc.Base64);
        resolve(hash);
      }
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Checks if an image with the same hash already exists and returns its URL
 */
export const findExistingImage = async (hash: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('book_images')
      .select('url')
      .eq('hash', hash)
      .maybeSingle();
      
    if (error || !data) {
      console.log("No existing image found with hash:", hash);
      return null;
    }
    
    console.log("Found existing image with hash:", hash, data.url);
    return data.url;
  } catch (error) {
    console.error("Error checking for existing image:", error);
    return null;
  }
};

/**
 * Records a new image hash and URL in the database
 */
export const recordImageHash = async (hash: string, url: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('book_images')
      .insert({
        hash,
        url,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error recording image hash:", error);
    } else {
      console.log("Successfully recorded image hash:", hash, url);
    }
  } catch (error) {
    console.error("Error recording image hash:", error);
  }
};

/**
 * Optimized function to get an image URL - either finds an existing one or uploads a new one
 */
export const getImageUrl = async (file: File, metadata?: { author?: string, name?: string, printingInstitute?: string }): Promise<string | null> => {
  try {
    // Generate hash for the image file with metadata
    const imageHash = await generateImageHash(file, metadata);
    
    // Check if the image already exists
    const existingImageUrl = await findExistingImage(imageHash);
    
    if (existingImageUrl) {
      return existingImageUrl;
    }
    
    // If image doesn't exist, upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const { data, error } = await supabase
      .storage
      .from('book-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Failed to upload to Supabase Storage:", error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('book-images')
      .getPublicUrl(fileName);
      
    const uploadUrl = urlData.publicUrl;
    
    // Record the hash and URL to our database
    await recordImageHash(imageHash, uploadUrl);
    
    return uploadUrl;
  } catch (error) {
    console.error("Error in getImageUrl:", error);
    return null;
  }
};
