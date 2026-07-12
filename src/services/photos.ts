import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

/**
 * Photo helpers. Photos never leave the device without an explicit user
 * action; callers must show the AI-processing disclosure before invoking
 * anything that uploads. Full photo payloads are never logged.
 */

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

export type PickResult =
  | { status: 'picked'; photo: PickedPhoto }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'error'; message: string };

/** Open the system photo library with permission handling. */
export async function pickPhoto(): Promise<PickResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) return { status: 'denied' };
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || result.assets.length === 0) return { status: 'cancelled' };

    const asset = result.assets[0];
    if (!asset.uri) return { status: 'error', message: 'The selected image could not be read.' };
    return {
      status: 'picked',
      photo: { uri: asset.uri, width: asset.width ?? 0, height: asset.height ?? 0 },
    };
  } catch {
    return { status: 'error', message: 'Could not open your photo library.' };
  }
}

/** Pre-warm the permission prompt at a moment the user understands the ask. */
export async function preparePhotoPermission(): Promise<boolean> {
  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Normalize a local image into a base64 data-URL for API submission.
 * Returns null when the file is missing or unreadable.
 */
export async function toDataUrl(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) return null;
    const ext = uri.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

/** Copy a picked photo into app storage so it survives picker cache eviction. */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory ?? ''}progress-photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const dest = `${dir}${id}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // Fall back to the original uri rather than losing the photo.
    return uri;
  }
}

/** Delete a stored photo file, ignoring already-missing files. */
export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Best-effort cleanup only.
  }
}
