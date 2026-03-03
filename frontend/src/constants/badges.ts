export type BadgeContext = {
  monthWalkCount: number;
  totalDistanceKm: number;
  heartsCount: number;
  reviewCount: number;
  dogCount: number;
};

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  criteria: (ctx: BadgeContext) => boolean;
  progress: (ctx: BadgeContext) => string;
};

export type BadgeSummary = BadgeDefinition & { achieved: boolean };

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_meet",
    title: "첫 걸음 메이트",
    description: "이번 달 첫 산책 모임을 완료하면 획득해요.",
    icon: "🌱",
    color: "#0ACF83",
    criteria: (ctx) => ctx.monthWalkCount >= 1,
    progress: (ctx) => `${Math.min(ctx.monthWalkCount, 1)}/1회`,
  },
  {
    id: "community_leader",
    title: "동네 리더",
    description: "한 달에 5회 이상 모임을 주최하거나 참여하면 받을 수 있어요.",
    icon: "🤝",
    color: "#F97316",
    criteria: (ctx) => ctx.monthWalkCount >= 5,
    progress: (ctx) => `${Math.min(ctx.monthWalkCount, 5)}/5회`,
  },
  {
    id: "trail_master",
    title: "거리 정복자",
    description: "누적 이동 거리 30km를 넘기면 모험가 배지를 드려요.",
    icon: "🌄",
    color: "#6366F1",
    criteria: (ctx) => ctx.totalDistanceKm >= 30,
    progress: (ctx) =>
      `${Math.min(ctx.totalDistanceKm, 30).toFixed(1)}/30km`,
  },
  {
    id: "trusted_guardian",
    title: "믿음직한 가디언",
    description: "받은 하트 10개 이상 또는 후기 3개 이상이면 획득해요.",
    icon: "💛",
    color: "#FACC15",
    criteria: (ctx) => ctx.heartsCount >= 10 || ctx.reviewCount >= 3,
    progress: (ctx) =>
      `${ctx.heartsCount}하트 · ${ctx.reviewCount}후기`,
  },
  {
    id: "pack_leader",
    title: "다둥이 보호자",
    description: "등록된 반려견이 2마리 이상이면 자동으로 지급돼요.",
    icon: "🐾",
    color: "#22D3EE",
    criteria: (ctx) => ctx.dogCount >= 2,
    progress: (ctx) => `${Math.min(ctx.dogCount, 2)}/2마리`,
  },
];

export function summarizeBadges(ctx: BadgeContext): BadgeSummary[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    achieved: badge.criteria(ctx),
  }));
}
