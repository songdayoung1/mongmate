import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp } from "../api/auth";
import { useAuthStore } from "../store/auth";

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => sendOtp(phone),
  });
}

export function useVerifyOtp() {
  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      verifyOtp(phone, code),
    onSuccess: async (res) => {
      await loginWithTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        me: res.user,
      });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      await logout();
    },
  });
}
