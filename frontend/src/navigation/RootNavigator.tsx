import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import MyProfileScreen from "../screens/my/MyProfileScreen";
import CreatePostScreen from "../screens/home/CreatePostScreen";
import AuthStartScreen from "../screens/auth/AuthStartScreen";
import SignupInfoScreen from "../screens/auth/SignupInfoScreen";
import AuthOtpScreen from "../screens/auth/AuthOtpScreen";
import PostDetailScreen from "../screens/home/PostDetailScreen";
import { useAuthStore } from "../store/auth";

export type RootStackParamList = {
  Main: undefined;
  MyProfile: undefined;
  CreatePost: undefined;
  PostDetail: { postId: number } | undefined; // 필요에 맞게

  AuthStart: undefined;
  SignupInfo: undefined;
  AuthOtp: {
    mode: "signup" | "login";
    phoneNumber: string;
    carrier?: string;
    name?: string;
    birth?: string;
    idDigit?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    text: "#111111",
    primary: "#0ACF83",
    card: "#ffffff",
    border: "#e5e5e5",
  },
};

export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthed = useAuthStore((s) => s.isAuthed);

  if (!hydrated) return null;

  return (
    <NavigationContainer theme={theme}>
      <KeyboardDismissWrapper>
        <Stack.Navigator
          key={isAuthed ? "authed" : "guest"}
          screenOptions={{ headerShown: false, headerTitleAlign: "center" }}
        >
          {isAuthed ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="MyProfile" component={MyProfileScreen} />
              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
              {/* ✅ 로그인 상태에서만 접근 가능하게 여기 둠 */}
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="AuthStart" component={AuthStartScreen} />
              <Stack.Screen name="SignupInfo" component={SignupInfoScreen} />
              <Stack.Screen name="AuthOtp" component={AuthOtpScreen} />
            </>
          )}
        </Stack.Navigator>
      </KeyboardDismissWrapper>
    </NavigationContainer>
  );
}
