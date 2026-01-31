import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";

// 현재 프로젝트 인증 플로우는 screens/auth/*에서 직접 API를 호출하고
// 성공 시 store의 setSession/setTokens를 호출하는 구조입니다.
// hooks는 최소한 로그아웃 등 공용 동작만 제공합니다.

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      await logout();
    },
  });
}
