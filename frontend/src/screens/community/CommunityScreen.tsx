import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";

export default function CommunityScreen() {
  const [search, setSearch] = React.useState("");

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="커뮤니티"
        subtitle="후기, 고민, 정보 공유"
        showSearch
        searchPlaceholder="게시글, 키워드 검색"
        searchValue={search}
        onChangeSearch={setSearch}
      />
      <View style={styles.center}>
        <Text style={styles.title}> 커뮤니티</Text>
        <Text style={styles.sub}>자유 게시판 / 후기 / 정보 공유 공간</Text>
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
