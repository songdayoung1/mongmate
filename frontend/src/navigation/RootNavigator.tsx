import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import CreatePostScreen from "../screens/home/CreatePostScreen";
import AuthStartScreen from "../screens/auth/AuthStartScreen";
import SignupInfoScreen from "../screens/auth/SignupInfoScreen";
import AuthOtpScreen from "../screens/auth/AuthOtpScreen";
import PostDetailScreen from "../screens/home/PostDetailScreen";
import { useAuthStore } from "../store/auth";

import EditMyProfileScreen from "../screens/my/EditMyProfileScreen";
import DogManageScreen from "../screens/my/DogManageScreen";
import DogEditScreen from "../screens/my/DogEditScreen";

export type RootStackParamList = {
  Main: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };

  // ✅ MyPage 기능
  EditMyProfile: undefined;
  DogManage: undefined;
  DogEdit: { mode: "create" } | { mode: "edit"; dogId: number };

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
              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />

              {/* ✅ 마이페이지 기능 */}
              <Stack.Screen
                name="EditMyProfile"
                component={EditMyProfileScreen}
              />
              <Stack.Screen name="DogManage" component={DogManageScreen} />
              <Stack.Screen name="DogEdit" component={DogEditScreen} />
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
