type AnyDateInput = string | number | Date;

function toDate(input: AnyDateInput): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);

  // 백엔드(LocalDateTime)가 타임존 없이 내려오는 경우가 많아서,
  // JS Date 파싱이 플랫폼별로 다르게 동작할 수 있음.
  // "YYYY-MM-DDTHH:mm:ss" 형태면 로컬타임으로 간주하도록 보정.
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return new Date(s.replace("T", " "));
  }
  return new Date(s);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 앱에서 쓰기 좋은 마감 텍스트로 변환 (예: "오늘 20:00까지", "내일 18:30까지")
 * - 정확한 UX 규칙이 정해지면 여기만 교체하면 됨
 */
export function formatDeadlineText(deadlineAt: AnyDateInput): string {
  const d = toDate(deadlineAt);
  if (Number.isNaN(d.getTime())) return "마감일 미정";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (diffDays === 0) return `오늘 ${time}까지`;
  if (diffDays === 1) return `내일 ${time}까지`;

  // 그 외는 날짜 표시
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${time}까지`;
}
