import { DOG_PLACEHOLDER_URI } from "../constants/placeholders";

export function resolveDogPhotoUri(raw?: string | null) {
  if (!raw) return DOG_PLACEHOLDER_URI;
  const trimmed = raw.trim();
  if (!trimmed) return DOG_PLACEHOLDER_URI;
  return trimmed;
}
