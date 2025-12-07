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
        // 인증이 안 되어 있으면 폰 인증 화면으로 보냄
        navigation.navigate("PhoneNumber");
      }
    }, [isAuthed, navigation])
  );

  // 인증되어 있으면 마이페이지 렌더
  return isAuthed ? <MyPageScreen /> : null;
}
