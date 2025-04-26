
import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a hash of the image file content
 */
export const generateImageHash = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        // Create SHA-256 hash of the file content
        const hashResult = CryptoJS.SHA256(e.target.result as string);
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
      .single();
      
    if (error || !data) {
      return null;
    }
    
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
    await supabase
      .from('book_images')
      .insert({
        hash,
        url,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error("Error recording image hash:", error);
  }
};
