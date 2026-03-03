import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

type SaveLocalImageOptions = {
  category: "profile" | "posts";
};

const UPLOAD_ROOT = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}mock-uploads`
  : null;

const WEB_STORAGE_PREFIX = "mock-upload";

async function ensureDir(path: string) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  } catch (e) {
    console.warn("[localUpload] ensureDir error", e);
  }
}

function inferExtension(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  if (match) return match[1];
  return "jpg";
}

function createFilename(ext: string) {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${stamp}-${rand}.${ext}`;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      } else {
        reject(new Error("empty result"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("blob read error"));
    reader.readAsDataURL(blob);
  });
}

async function saveOnWeb(sourceUri: string, category: SaveLocalImageOptions["category"]) {
  if (typeof window === "undefined" || !window?.localStorage) {
    return { uri: sourceUri, isPersisted: false } as const;
  }

  try {
    const response = await fetch(sourceUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const mime = blob.type || "image/jpeg";
    const dataUri = `data:${mime};base64,${base64}`;
    const key = `${WEB_STORAGE_PREFIX}:${category}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.localStorage.setItem(key, dataUri);
    return { uri: dataUri, isPersisted: true, storageKey: key } as const;
  } catch (e) {
    console.warn("[localUpload] web copy failed", e);
    return { uri: sourceUri, isPersisted: false } as const;
  }
}

export async function saveLocalImageCopy(
  sourceUri: string,
  options: SaveLocalImageOptions,
) {
  if (Platform.OS === "web") {
    return saveOnWeb(sourceUri, options.category);
  }

  if (!UPLOAD_ROOT) {
    return { uri: sourceUri, isPersisted: false } as const;
  }

  const ext = inferExtension(sourceUri);
  const targetDir = `${UPLOAD_ROOT}/${options.category}`;
  await ensureDir(targetDir);

  const filename = createFilename(ext);
  const destination = `${targetDir}/${filename}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return { uri: destination, isPersisted: true } as const;
}
