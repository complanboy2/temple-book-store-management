
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads an image to Supabase Storage and returns a public URL
 * @param file The file to upload
 * @returns A promise that resolves to the public URL of the uploaded image, or null if upload fails
 */
export const getImageUrl = async (file: File): Promise<string | null> => {
  try {
    console.log("Uploading image to Supabase Storage...");
    
    // Generate a unique filename
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
      
    console.log("Image uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in getImageUrl:", error);
    return null;
  }
};
