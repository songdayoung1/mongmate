import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs, { type MainTabParamList } from "./MainTabs";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";

import CreatePostScreen from "../screens/home/CreatePostScreen";
import PostDetailScreen from "../screens/home/PostDetailScreen";

import AuthStartScreen from "../screens/auth/AuthStartScreen";
import SignupInfoScreen from "../screens/auth/SignupInfoScreen";
import AuthOtpScreen from "../screens/auth/AuthOtpScreen";

import EditMyProfileScreen from "../screens/my/EditMyProfileScreen";
import DogManageScreen from "../screens/my/DogManageScreen";
import DogEditScreen from "../screens/my/DogEditScreen";
import MyPostsScreen from "../screens/my/MyPostsScreen";
import EditMyPostScreen from "../screens/my/EditMyPostScreen";

import { useAuthStore } from "../store/auth";

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };

  EditMyProfile: undefined;
  MyPosts: undefined;
  EditMyPost: { postId: string };
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

  /**
   * ✅ 핵심: NavigationContainer 자체를 key로 리마운트
   * - 로그아웃/로그인 시 네비 상태가 남아 "화면이 안 바뀌는" 문제를 확실히 방지
   */
  return (
    <NavigationContainer theme={theme} key={isAuthed ? "authed" : "guest"}>
      <KeyboardDismissWrapper>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerTitleAlign: "center",
            animation: "slide_from_right",
          }}
        >
          {isAuthed ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />

              <Stack.Screen
                name="EditMyProfile"
                component={EditMyProfileScreen}
              />
              <Stack.Screen name="MyPosts" component={MyPostsScreen} />
              <Stack.Screen name="EditMyPost" component={EditMyPostScreen} />
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
