import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/home/HomeScreen";
import WalkScreen from "../screens/walk/WalkScreen";
import CommunityScreen from "../screens/community/CommunityScreen";
import MyPageGate from "../screens/my/MyPageGate";
import TabBarIcon from "../components/TabBarIcon";
import ChatStackNavigator from "./ChatStackNavigator";

export type MainTabParamList = {
  Home: undefined;
  Walk: undefined;
  Community: undefined;
  Chat: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0ACF83",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#eee",
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Walk"
        component={WalkScreen}
        options={{
          title: "산책하기",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: "커뮤니티",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="message-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackNavigator} // ✅ 리스트/상세 스택
        options={{
          title: "채팅",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="message-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageGate}
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
