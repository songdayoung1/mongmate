import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function BackHeader({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NavigationProp<Record<string, object | undefined>>>();

  const canGoBack = navigation.canGoBack?.() ?? false;

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 12,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Pressable
        onPress={() => {
          if (canGoBack) navigation.goBack();
          // canGoBack이 false(루트 화면)라면 누르면 아무 동작 없음
        }}
        hitSlop={12}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed
            ? "rgba(255,255,255,0.2)"
            : "rgba(255,255,255,0.15)",
        })}
      >
        {/* 간단한 화살표(유니코드). 필요시 아이콘 라이브러리로 교체 가능 */}
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
          ‹
        </Text>
      </Pressable>

      {title ? (
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
