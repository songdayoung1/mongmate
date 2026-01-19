// metro.config.cjs
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 중요: export 조건 우선순위 변경 (ESM import 조건을 뒤로 밀기)
config.resolver.unstable_conditionNames = [
  "browser",
  "require",
  "react-native",
];

module.exports = config;
