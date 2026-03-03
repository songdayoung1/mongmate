import { Asset } from "expo-asset";
import { Platform } from "react-native";

type PlaceholderKind = "dog" | "community" | "guardian";

const assets: Record<PlaceholderKind, ReturnType<typeof Asset.fromModule>> = {
  dog: Asset.fromModule(
    require("../../assets/placeholders/dog-placeholder.png"),
  ),
  community: Asset.fromModule(
    require("../../assets/placeholders/community-placeholder.png"),
  ),
  guardian: Asset.fromModule(
    require("../../assets/placeholders/guardian-placeholder.png"),
  ),
};

const REMOTE_PLACEHOLDER_ENABLED = false;
const REMOTE_SOURCE: Partial<Record<PlaceholderKind, string>> = {
  dog: null,
  community: null,
  guardian: null,
};

function resolvePlaceholder(kind: PlaceholderKind) {
  if (REMOTE_PLACEHOLDER_ENABLED && REMOTE_SOURCE[kind]) {
    return REMOTE_SOURCE[kind]!;
  }
  const asset = assets[kind];
  if (Platform.OS === "web") {
    return asset.uri;
  }
  return asset.localUri ?? asset.uri;
}

export const DOG_PLACEHOLDER_URI = resolvePlaceholder("dog");
export const COMMUNITY_PLACEHOLDER_URI = resolvePlaceholder("community");
export const GUARDIAN_PLACEHOLDER_URI = resolvePlaceholder("guardian");
