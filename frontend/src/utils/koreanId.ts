// src/utils/koreanId.ts
import type { Gender } from "../api/auth";

export function deriveDobAndGender(
  birth6: string,
  idDigit: string
): { dateOfBirth: string; gender: Gender } {
  if (!/^\d{6}$/.test(birth6)) throw new Error("birth6 must be 6 digits");
  if (!/^[1-4]$/.test(idDigit)) throw new Error("idDigit must be 1~4");

  const yy = Number(birth6.slice(0, 2));
  const mm = Number(birth6.slice(2, 4));
  const dd = Number(birth6.slice(4, 6));

  const century = idDigit === "1" || idDigit === "2" ? 1900 : 2000;
  const yyyy = century + yy;

  const gender: Gender = Number(idDigit) % 2 === 1 ? "MALE" : "FEMALE";

  const dateOfBirth = `${yyyy}-${String(mm).padStart(2, "0")}-${String(
    dd
  ).padStart(2, "0")}`;
  return { dateOfBirth, gender };
}
