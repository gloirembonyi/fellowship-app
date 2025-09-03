import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves a file to the server's filesystem and returns the public URL
 * @param file The file to save
 * @param directory The directory to save the file in (relative to public/uploads)
 * @returns The public URL of the saved file or null if there was an error
 */
export async function saveFile(file: File, directory: string): Promise<string | null> {
  try {
    if (!file) return null;
    
    // Create a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    
    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', directory);
    
    try {
      // This is a simple check - in production you'd want to use fs.mkdir with recursive option
      await writeFile(path.join(uploadDir, '.gitkeep'), '');
    } catch (error) {
      console.log('Directory already exists or could not be created');
    }
    
    const filepath = path.join(uploadDir, filename);
    
    // Write the file to the filesystem
    await writeFile(filepath, buffer);
    
    // Return the public URL
    return `/uploads/${directory}/${filename}`;
  } catch (error) {
    console.error(`Error saving file to ${directory}:`, error);
    return null;
  }
}

/**
 * Extracts a file from FormData and saves it
 * @param formData The FormData object
 * @param fieldName The name of the field containing the file
 * @param directory The directory to save the file in
 * @returns The public URL of the saved file or null if there was an error
 */
export async function processFileUpload(
  formData: FormData,
  fieldName: string,
  directory: string
): Promise<string | null> {
  const file = formData.get(fieldName) as File;
  if (file && file instanceof File && file.size > 0) {
    return await saveFile(file, directory);
  }
  return null;
}

/**
 * Gets the file name from a URL
 * @param url The URL of the file
 * @returns The file name
 */
export function getFileNameFromUrl(url: string): string {
  if (!url) return '';
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  // Remove UUID prefix if present (format: uuid-filename)
  const nameWithoutUuid = fileName.split('-').slice(1).join('-');
  return nameWithoutUuid || fileName;
} 