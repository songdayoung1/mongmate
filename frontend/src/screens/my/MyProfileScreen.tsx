import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

export default function MyPageScreen() {
  const { isAuthed, userId, logout } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // TODO: 나중에 실제 API/전역 상태에서 가져오기
  const dogs = [
    {
      id: "1",
      name: "초코",
      info: "푸들 · 3살 · 활발함",
    },
    {
      id: "2",
      name: "몽실",
      info: "말티푸 · 2살 · 순함",
    },
  ];

  const onLogout = async () => {
    await logout();
    Alert.alert("로그아웃", "로그아웃 되었습니다.");
  };

  // 지금은 MyProfile 화면으로 보내고, 나중에 EditProfile로 변경해도 됨
  const goEditProfile = () => {
    navigation.navigate("MyProfile");
  };

  // const goLogin = () => {
  //   navigation.navigate("PhoneNumber");
  // };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 상단 간단 프로필 영역 */}
        <View style={styles.profileWrap}>
          <View style={styles.avatar} />
          <Text style={styles.nick}>
            {isAuthed ? "반가워요!" : "로그인이 필요합니다"}
          </Text>
          <Text style={styles.loc}>
            {isAuthed
              ? user?.phone ?? ""
              : "마이페이지를 이용하려면 로그인해주세요"}
          </Text>
        </View>

        {isAuthed ? (
          <>
            {/* 내 프로필 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>내 프로필</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.label}>핸드폰 번호</Text>
                  <Text style={styles.value}>{user?.phone ?? "-"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>인증 동네</Text>
                  <Text style={styles.value}>동네 인증 후 표시될 예정</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={goEditProfile}
              >
                <Text style={styles.editButtonText}>프로필 수정</Text>
              </TouchableOpacity>
            </View>

            {/* 내 반려견 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>내 반려견</Text>
              {dogs.length === 0 ? (
                <Text style={styles.emptyText}>
                  등록된 반려견이 없습니다. 나중에 추가할 수 있어요.
                </Text>
              ) : (
                dogs.map((dog) => (
                  <View key={dog.id} style={styles.dogCard}>
                    {/* 이미지 자리 (임시 빈박스) */}
                    <View style={styles.dogAvatar} />
                    <View>
                      <Text style={styles.dogName}>{dog.name}</Text>
                      <Text style={styles.dogInfo}>{dog.info}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 기타 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기타</Text>
              <View style={styles.menu}>
                <TouchableOpacity style={styles.item}>
                  <Text style={styles.itemText}>내가 쓴 산책글</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item}>
                  <Text style={styles.itemText}>설정</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 로그아웃 */}
            <TouchableOpacity
              style={[styles.item, styles.logout]}
              onPress={onLogout}
            >
              <Text style={[styles.itemText, styles.logoutText]}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 비로그인 상태에서 로그인 유도 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.editButton}
                // TODO 로그인 검증
                // onPress={goLogin}
              >
                <Text style={styles.editButtonText}>로그인 하러 가기</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  scroll: {
    paddingBottom: 32,
  },
  profileWrap: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  nick: { fontSize: 18, fontWeight: "700" },
  loc: { color: "#666", marginTop: 2, textAlign: "center" },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    color: "#111827",
  },

  editButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // 반려견 카드
  dogCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 8,
  },
  dogAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  dogName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dogInfo: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    paddingVertical: 8,
  },

  // 기타 / 메뉴
  menu: {
    marginTop: 4,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  itemText: { fontSize: 16 },
  logout: {
    marginTop: 12,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: "#e11d48",
    fontWeight: "700",
  },
});
