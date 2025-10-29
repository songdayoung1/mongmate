import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LabeledField from "../../components/LabeledField";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/RootNavigator";
import BackHeader from "../../components/BackHeader";

export default function PhoneNumberScreen() {
  const [phone, setPhone] = React.useState("");
  const insets = useSafeAreaInsets();

  const canNext = /^01\d{8,9}$/.test(phone);

  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0ACF83" /* 초록 메인 */ }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
    >
      {/* 뒤로가기 */}
      <BackHeader />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 60, // ✅ 하단 버튼 자리 확보(겹침 방지)
        }}
        keyboardShouldPersistTaps="handled" // ✅ 입력 중 다른 곳 터치 시 포커스/탭 정상 처리
        showsVerticalScrollIndicator={false}
      >
        {/* 중앙 컨텐츠 */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* 중앙 앱 아이콘 느낌의 카드 */}
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 24,
              backgroundColor: "rgba(255,255,255,0.95)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 16,
                backgroundColor: "#0ACF83",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#fff",
                  borderRadius: 10,
                }}
              />
            </View>
          </View>

          {/* 타이틀/카피 */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
              멍멍메이트
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 16 }}>
              함께 걷는 즐거움
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 14,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 20,
              }}
            >
              우리 동네 강아지 친구들과{"\n"}행복한 산책을 시작해보세요
            </Text>
          </View>

          {/* 입력 필드 (초록 배경에 어울리게 반투명 스타일) */}
          <View style={{ width: "100%", marginTop: 24 }}>
            <LabeledField
              label="휴대폰 번호"
              placeholder="01012345678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              maxLength={11}
            />
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 '다음' 버튼 */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 18,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate("VerifyCode", { phone })}
          disabled={!canNext}
          style={({ pressed }) => ({
            opacity: !canNext ? 0.4 : pressed ? 0.9 : 1,
            backgroundColor: "#ffffff",
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text
            style={{
              color: "#0ACF83",
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            다음
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
