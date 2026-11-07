import { File } from 'expo-file-system';

/** Remove photo files the app copied into its own storage. Missing files are ignored. */
export function deletePhotoFiles(uris: string[]): void {
  for (const uri of uris) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // A photo that can't be removed only wastes a little space; don't block the delete.
    }
  }
}
