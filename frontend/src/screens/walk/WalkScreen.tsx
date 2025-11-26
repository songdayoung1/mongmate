import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";

export default function WalkScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="산책하기"
        subtitle="오늘의 산책을 기록해보세요"
        backgroundColor="#FFFFFF"
      />
      <View style={styles.center}>
        <Text style={styles.title}>🏞️ 산책하기</Text>
        <Text style={styles.sub}>산책 시작 버튼 / 경로 기록 기능 예정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  sub: { color: "#666", marginTop: 8 },
});
