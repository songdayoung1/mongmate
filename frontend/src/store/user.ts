import { create } from 'zustand';

export type UserProfile = {
  id: string;
  nickname: string;
  region: string;
  avatarUrl?: string; // Optional: for future use
};

export type UserStats = {
  monthWalkCount: number;
  totalDistanceKm: number;
};

type UserStore = {
  profile: UserProfile;
  stats: UserStats;
  // Actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateStats: (stats: Partial<UserStats>) => void;
};

// Mock initial data
const initialProfile: UserProfile = {
  id: 'user-1',
  nickname: '만두',
  region: '마포구 성산동',
};

const initialStats: UserStats = {
  monthWalkCount: 3,
  totalDistanceKm: 12.4,
};

export const useUserStore = create<UserStore>((set) => ({
  profile: initialProfile,
  stats: initialStats,
  updateProfile: (updates) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),
  updateStats: (updates) =>
    set((state) => ({
      stats: { ...state.stats, ...updates },
    })),
}));
