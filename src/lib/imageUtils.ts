/**
 * Compress an image file to reduce size for mobile uploads
 * @param file - The original image file
 * @param maxWidth - Maximum width to resize to (default 1200px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Promise with compressed base64 string
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Create object URL and load image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Cleanup object URL after load
    img.onload = function() {
      URL.revokeObjectURL(objectUrl);
      
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };
  });
}

/**
 * Read a file as base64 with timeout protection
 */
export function readFileAsBase64(file: File, timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error("File read timed out"));
    }, timeoutMs);

    reader.onload = () => {
      clearTimeout(timeout);
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
