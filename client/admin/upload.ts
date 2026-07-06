// Shared client-side upload helper for the admin CMS. Reads a browser File as a
// base64 string (FileReader → data URL → base64 payload) and calls the
// `uploadMedia` request, returning the public URL. The server stores the bytes
// and records a mediaAsset. `uploadMedia` input fields are { kind, name,
// dataBase64 } (matching shared/api.ts).
import { apiPost } from '../api';

export type UploadKind = 'image' | 'audio' | 'video';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('unexpected FileReader result'));
        return;
      }
      // result is a data URL: "data:<mime>;base64,<payload>" — strip the prefix.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => { reject(reader.error ?? new Error('failed to read file')); };
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(
  kind: UploadKind,
  file: File,
): Promise<string> {
  const dataBase64 = await readFileAsBase64(file);
  const { url } = await apiPost<{ url: string }>('uploadMedia', {
    kind,
    name: file.name,
    dataBase64,
  });
  return url;
}
