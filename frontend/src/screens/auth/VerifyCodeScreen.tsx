import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import type { AuthStackParamList } from "../../navigation/RootNavigator";
import BackHeader from "../../components/BackHeader";

type VerifyRoute = RouteProp<AuthStackParamList, "VerifyCode">;

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<VerifyRoute>();
  const [code, setCode] = React.useState("");

  const phone = route.params?.phone ?? "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0ACF83" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BackHeader />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
          인증번호 입력
        </Text>
        {!!phone && (
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
            {phone}로 전송된 6자리 코드를 입력해주세요
          </Text>
        )}

        <TextInput
          keyboardType="number-pad"
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          placeholder="6자리 코드"
          placeholderTextColor="rgba(255,255,255,0.7)"
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 22,
            color: "#fff",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            letterSpacing: 6,
          }}
        />
      </View>

      {/* 하단 '확인' */}
      <View
        style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 18 }}
      >
        <Pressable
          onPress={() => Alert.alert("확인", "인증 되었습니다.")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            backgroundColor: "#ffffff",
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ color: "#0ACF83", fontSize: 16, fontWeight: "800" }}>
            확인
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
