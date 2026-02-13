import React, { useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth";
import MyPageScreen from "./MyPageScreen";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

export default function MyPageGate() {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      if (!isAuthed) {
        // ✅ 로그아웃/만료 등으로 비인증 상태면 인증 시작 화면으로
        navigation.navigate("AuthStart");
      }
    }, [isAuthed, navigation]),
  );

  // ✅ 인증되어 있으면 마이페이지 렌더
  // (비인증일 때도 일단 렌더가 잠깐 될 수 있으니, 위 useFocusEffect가 바로 보내줌)
  return <MyPageScreen />;
}
