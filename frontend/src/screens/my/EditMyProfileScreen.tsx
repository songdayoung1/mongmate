import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import TopHeader from "../../components/TopHeader";
import { useProfile, useUpsertProfile } from "../../hooks/profile";
import { usePhotoPicker } from "../../hooks/usePhotoPicker";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../store/auth";
import { useLocalMediaStore } from "../../store/localMedia";
import { usePostStore } from "../../store/posts";
import { COLORS, SHADOWS } from "../../constants/theme";
import { saveLocalImageCopy } from "../../lib/localUpload";

type GenderCode = "M" | "F" | null;

function normalizeGender(code: string | null | undefined): GenderCode {
  const c = (code ?? "").toUpperCase();
  if (c === "M" || c === "MALE") return "M";
  if (c === "F" || c === "FEMALE") return "F";
  return null;
}

function isLocalUri(uri: string) {
  return (
    uri.startsWith("file://") ||
    uri.startsWith("ph://") ||
    uri.startsWith("assets-library://") ||
    uri.startsWith("blob:")
  );
}

type ScreenRoute = RouteProp<RootStackParamList, "EditMyProfile">;

export default function EditMyProfileScreen() {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<any>();
  const { data, isLoading } = useProfile();
  const mut = useUpsertProfile();
  const phoneNumber = useAuthStore((s) => s.phoneNumber ?? "");
  const loadHomePosts = usePostStore((s) => s.loadPosts);
  const forceSetup = route?.params?.forceSetup ?? false;
  const needsProfile = data?.profileExists === false;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof navigation.setOptions === "function") {
      navigation.setOptions({ gestureEnabled: !forceSetup });
    }
  }, [navigation, forceSetup]);

  const initial = useMemo(() => {
    const guardian = data?.guardianProfile;
    return {
      nickname: guardian?.nickname ?? phoneNumber ?? "",
      genderCode: normalizeGender(guardian?.genderCode),
      bio: guardian?.bio ?? "",
      avatarUrl: guardian?.avatarUrl ?? "",
    };
  }, [data?.guardianProfile, phoneNumber]);

  const [nickname, setNickname] = useState(initial.nickname);
  const [genderCode, setGenderCode] = useState<GenderCode>(initial.genderCode);
  const [bio, setBio] = useState(initial.bio);
  const {
    photos: avatarPhotos,
    pickFromLibrary,
    captureFromCamera,
    removePhoto,
    resetPhotos,
  } = usePhotoPicker({
    maxCount: 1,
    initialUris: initial.avatarUrl ? [initial.avatarUrl] : [],
    alertTitle: "안내",
    alertMessage: "프로필 사진은 1장만 등록할 수 있어요.",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const setProfileAvatarUri = useLocalMediaStore(
    (s) => s.setProfileAvatarUri,
  );
  const avatarPhoto = avatarPhotos[0] ?? null;

  useEffect(() => {
    setNickname(initial.nickname);
    setGenderCode(initial.genderCode);
    setBio(initial.bio);
  }, [initial]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  const navigateAfterSave = useCallback(() => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: "Main", params: { screen: "Home" } }],
    });
  }, [navigation]);

  const showBottomToast = useCallback(
    (message: string, onFinish?: () => void) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
        onFinish?.();
      }, 1600);
    },
    [],
  );

  const handlePickAvatar = useCallback(async () => {
    if (mut.isPending) return;
    await pickFromLibrary();
  }, [mut.isPending, pickFromLibrary]);

  const handleCaptureAvatar = useCallback(async () => {
    if (mut.isPending) return;
    await captureFromCamera();
  }, [mut.isPending, captureFromCamera]);

  const handleClearAvatar = useCallback(() => {
    if (mut.isPending) return;
    resetPhotos();
    setProfileAvatarUri(null);
  }, [mut.isPending, resetPhotos, setProfileAvatarUri]);

  const onSave = async () => {
    if (!nickname.trim()) {
      Alert.alert("입력 오류", "닉네임은 필수 항목입니다.");
      return;
    }

    try {
      let avatarToSave: string | null = avatarPhoto ? avatarPhoto.uri : null;
      if (avatarPhoto && isLocalUri(avatarPhoto.uri)) {
        const saved = await saveLocalImageCopy(avatarPhoto.uri, {
          category: "profile",
        });
        avatarToSave = saved.uri;
        setProfileAvatarUri(saved.uri);
      } else if (!avatarPhoto) {
        setProfileAvatarUri(null);
      } else {
        setProfileAvatarUri(avatarPhoto.uri);
      }

      await mut.mutateAsync({
        mode: needsProfile ? "create" : "update",
        body: {
          nickname: nickname.trim(),
          genderCode,
          bio: bio.trim() ? bio.trim() : null,
          avatarUrl: avatarToSave,
        },
      });

      loadHomePosts({ page: 0, size: 20 }).catch(() => {});
      showBottomToast("프로필 변경이 완료되었습니다.", navigateAfterSave);
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "프로필을 저장하지 못했어요.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="프로필 설정"
        subtitle={forceSetup ? "서비스 이용 전에 필수로 작성해야 해요" : "닉네임과 소개를 자유롭게 수정하세요"}
        backgroundColor="#FFFFFF"
        showBack={!forceSetup}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {forceSetup && (
          <View style={styles.forceBanner}>
            <Text style={styles.forceTitle}>프로필을 먼저 완료해주세요</Text>
            <Text style={styles.forceDesc}>
              닉네임과 연락처 정보를 입력해야 커뮤니티 및 산책 모집 기능을 사용할 수 있어요.
            </Text>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>보호자 정보</Text>

          <Text style={styles.label}>프로필 이미지</Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarPreviewBox}>
              {avatarPhoto ? (
                <Image source={{ uri: avatarPhoto.uri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarPlaceholderText}>+</Text>
              )}
            </View>
            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={handlePickAvatar}
                disabled={mut.isPending}
              >
                <Text style={styles.avatarBtnText}>사진첩에서 선택</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={handleCaptureAvatar}
                disabled={mut.isPending}
              >
                <Text style={styles.avatarBtnText}>카메라 촬영</Text>
              </TouchableOpacity>
              {avatarPhoto && (
                <TouchableOpacity
                  style={[styles.avatarBtn, styles.avatarBtnGhost]}
                  onPress={handleClearAvatar}
                  disabled={mut.isPending}
                >
                  <Text style={[styles.avatarBtnText, styles.avatarBtnGhostText]}>
                    초기화
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.label}>닉네임 (필수)</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="예) 몽몽이 보호자"
            maxLength={30}
            editable={!mut.isPending}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>성별</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, genderCode === "M" && styles.pillOn]}
              onPress={() => setGenderCode(genderCode === "M" ? null : "M")}
              disabled={mut.isPending}
            >
              <Text
                style={[styles.pillText, genderCode === "M" && styles.pillTextOn]}
              >
                남성
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, genderCode === "F" && styles.pillOn]}
              onPress={() => setGenderCode(genderCode === "F" ? null : "F")}
              disabled={mut.isPending}
            >
              <Text
                style={[styles.pillText, genderCode === "F" && styles.pillTextOn]}
              >
                여성
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, genderCode === null && styles.pillOn]}
              onPress={() => setGenderCode(null)}
              disabled={mut.isPending}
            >
              <Text
                style={[styles.pillText, genderCode === null && styles.pillTextOn]}
              >
                선택 안함
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>소개</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="반려견과 나를 자유롭게 소개해주세요"
            maxLength={300}
            multiline
            editable={!mut.isPending}
          />
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>잠깐!</Text>
          <Text style={styles.hintText}>
            닉네임은 다른 사용자에게 보여지는 정보예요. 연락처 노출이 부담된다면 별도의 닉네임을 설정해주세요.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, mut.isPending && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={mut.isPending}
        >
          <Text style={styles.primaryBtnText}>
            {mut.isPending ? "저장 중..." : "프로필 저장"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1, paddingHorizontal: 16 },
  forceBanner: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF4E6",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  forceTitle: { fontWeight: "900", color: "#9A3412", fontSize: 14 },
  forceDesc: {
    marginTop: 4,
    color: "#9A3412",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  card: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  avatarPreviewBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholderText: { fontSize: 28, color: "#D1D5DB", fontWeight: "900" },
  avatarActions: { flex: 1, gap: 8 },
  avatarBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignSelf: "flex-start",
  },
  avatarBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  avatarBtnGhost: { backgroundColor: "#F4F4F5" },
  avatarBtnGhostText: { color: "#374151" },

  label: { fontSize: 12, fontWeight: "900", color: "#111827" },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    ...Platform.select({ ios: SHADOWS.soft, android: { elevation: 1 } }),
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },

  pillRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  pillOn: { backgroundColor: "#ECFDF3", borderColor: "#0ACF83" },
  pillText: { fontWeight: "900", color: "#111827", fontSize: 13 },
  pillTextOn: { color: "#0ACF83" },

  hintCard: {
    marginTop: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  hintTitle: { fontSize: 13, fontWeight: "900", color: "#9A3412" },
  hintText: { marginTop: 6, fontSize: 12, color: "#9A3412" },

  primaryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    alignItems: "center",
  },
  toastText: { color: "#fff", fontWeight: "800" },
});
