// 임시 모킹 API — 나중에 실제 서버로 교체
export type VerifyResponse = {
  isNew: boolean; // 첫 가입인지 여부
  accessToken: string;
  refreshToken: string;
  user: { id: string; nickname: string | null; phone: string };
};

// 폰번호로 OTP 전송 — 여기선 항상 성공 가정
export async function sendOtp(phone: string): Promise<{ success: true }> {
  await wait(400);
  return { success: true };
}

// OTP 검증 — code === "123456" 이면 성공, 아니면 throw
export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyResponse> {
  await wait(600);
  if (code !== "123456") {
    throw new Error("INVALID_CODE");
  }

  const isNew = phone.endsWith("0"); // 임시 규칙: 끝자리가 0이면 신규라고 가정
  return {
    isNew,
    accessToken: `mock_access_${phone}`,
    refreshToken: `mock_refresh_${phone}`,
    user: { id: `u_${phone}`, nickname: isNew ? null : "댕댕이", phone },
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
