export interface WalkStats {
  totalWalkCount: number; //횟수
  totalDistanceKm: number; // 거리
  totalDurationMin: number; // 시간
  lastWalkAt?: string; // 마지막 산책
}

export interface GuardianProfile {
  id: string;
  nickname: string;
  avatarUrl?: string; // 아바타?
  region: string; // "마포구 성산동"
  intro?: string; // 한 줄 소개
  phone: string; // "01012345678"
  birthDate?: string; // "1994-05-12"
  joinDate: string; // "2025-11-01"
  stats?: WalkStats;
}

export interface DogProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  breed?: string;
  ageYears?: number;
  sex?: "MALE" | "FEMALE";
  size?: "SMALL" | "MEDIUM" | "LARGE";
  personalityTags?: string[];
}
