import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public ID from a Cloudinary secure URL and deletes the asset.
 * @param url The full Cloudinary secure URL (e.g., https://res.cloudinary.com/...)
 */
export async function deleteCloudinaryImage(url: string) {
  try {
    if (!url || !url.includes('cloudinary.com')) return false;

    // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.png
    // We want to extract "folder/filename"

    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return false;

    // urlParts[1] is something like "v1783368449/salon/products/filename.png"
    const pathParts = urlParts[1].split('/');
    
    // Remove the version part (e.g., v1783368449) if it exists (starts with 'v' and is numeric)
    if (pathParts[0].startsWith('v') && !isNaN(Number(pathParts[0].substring(1)))) {
      pathParts.shift();
    }

    // Join the rest and remove the extension
    const fullPathWithExtension = pathParts.join('/');
    const lastDotIndex = fullPathWithExtension.lastIndexOf('.');
    
    const publicId = lastDotIndex !== -1 
      ? fullPathWithExtension.substring(0, lastDotIndex)
      : fullPathWithExtension;

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted Cloudinary image ${publicId}:`, result);
    
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting Cloudinary image:', error);
    return false;
  }
}
