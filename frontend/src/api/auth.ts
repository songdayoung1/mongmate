// src/api/auth.ts
import { apiFetch } from "./client";

export async function sendSmsCode(phoneNumber: string) {
  return apiFetch<void>("/api/auth/sms/send", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export type VerifyAuthCodeResponse = { success: boolean };

export async function verifySmsCode(phoneNumber: string, code: string) {
  return apiFetch<VerifyAuthCodeResponse>("/api/auth/sms/verify", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, code }),
  });
}

export type Gender = "MALE" | "FEMALE";

export type SignUpRequest = {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  phoneNumber: string;
  marketingAgreed: boolean;
};

export type AuthResponse = {
  userId: number;
  accessToken: string;
  refreshToken: string;
};

export async function signup(payload: SignUpRequest) {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(phoneNumber: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}
