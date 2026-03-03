import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type LocalPhoto = { id: string; uri: string };

type UsePhotoPickerOptions = {
  maxCount?: number;
  initialUris?: string[];
  alertTitle?: string;
  alertMessage?: string;
};

function buildPhotos(uris: string[]): LocalPhoto[] {
  return uris.map((uri, index) => ({
    id: `initial-${index}-${Date.now()}`,
    uri,
  }));
}

export function usePhotoPicker(options: UsePhotoPickerOptions = {}) {
  const { maxCount = 5, initialUris = [], alertTitle, alertMessage } = options;
  const initialKey = useMemo(() => initialUris.join("|"), [initialUris]);

  const [photos, setPhotos] = useState<LocalPhoto[]>(() =>
    buildPhotos(initialUris),
  );

  useEffect(() => {
    setPhotos(buildPhotos(initialUris));
  }, [initialKey]);

  const ensureLimit = useCallback(() => {
    if (photos.length >= maxCount) {
      Alert.alert(
        alertTitle ?? "안내",
        alertMessage ?? `사진은 최대 ${maxCount}장까지 첨부할 수 있어요.`,
      );
      return false;
    }
    return true;
  }, [photos.length, maxCount, alertMessage, alertTitle]);

  const requestLibraryPermission = useCallback(async () => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진첩 접근 권한을 허용해주세요.");
      return false;
    }
    return true;
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 접근 권한을 허용해주세요.");
      return false;
    }
    return true;
  }, []);

  const appendPhotos = useCallback((uris: string[]) => {
    setPhotos((prev) => [
      ...prev,
      ...uris.map((uri) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri,
      })),
    ]);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    if (!ensureLimit()) return;
    const ok = await requestLibraryPermission();
    if (!ok) return;
    const remain = maxCount - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remain,
    });
    if (result.canceled || !result.assets?.length) return;
    const selected = result.assets.slice(0, remain).map((asset) => asset.uri);
    appendPhotos(selected);
  }, [appendPhotos, ensureLimit, maxCount, photos.length, requestLibraryPermission]);

  const captureFromCamera = useCallback(async () => {
    if (!ensureLimit()) return;
    const ok = await requestCameraPermission();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    appendPhotos([result.assets[0].uri]);
  }, [appendPhotos, ensureLimit, requestCameraPermission]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  return {
    photos,
    setPhotos,
    pickFromLibrary,
    captureFromCamera,
    removePhoto,
    resetPhotos,
  };
}
