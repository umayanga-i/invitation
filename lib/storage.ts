'use client';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 1600;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Validate and optimize a photo for the invitation data store.
 * TODO(supabase): upload the optimized Blob to Supabase Storage and return its public URL.
 */
export async function uploadInvitationPhoto(file: File, options?: { maxDataUrlLength: number }): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > MAX_FILE_SIZE) throw new Error('The image must be 5 MB or smaller.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened. Choose another file.');
  }

  try {
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image resizing is not supported in this browser.');
    context.drawImage(bitmap, 0, 0, width, height);
    if (options) {
      // Multiple photo slots share one saved invitation. Bound each encoded image
      // rather than letting a large PNG fail only when the invitation is saved.
      for (let attempt = 0; attempt < 7; attempt++) {
        const encoded = canvas.toDataURL('image/webp', Math.max(0.55, 0.86 - attempt * 0.08));
        if (encoded.length <= options.maxDataUrlLength) return encoded;
        canvas.width = Math.max(1, Math.round(canvas.width * 0.75));
        canvas.height = Math.max(1, Math.round(canvas.height * 0.75));
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      }
      throw new Error('This photo is too large to save. Choose a smaller image.');
    }
    return canvas.toDataURL(file.type, file.type === 'image/png' ? undefined : 0.86);
  } finally {
    bitmap.close();
  }
}
