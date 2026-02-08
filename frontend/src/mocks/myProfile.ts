export type MyUserMock = {
  id: number;
  phoneNumber: string;
  createdAt: string; // 가입일
};

export type MyProfileMock = {
  user: MyUserMock;
  guardianProfile: {
    userId: number;
    nickname: string;
    genderCode: "M" | "F" | null;
    bio: string | null;
    avatarUrl: string | null;
    heartsCount: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
  };
  // ✅ 위치 미구현: 항상 null로 둘 것
  neighborhood: null;
};

export const myProfile: MyProfileMock = {
  user: {
    id: 1,
    phoneNumber: "010-1234-5678",
    createdAt: new Date().toISOString(),
  },
  guardianProfile: {
    userId: 1,
    nickname: "만두",
    genderCode: null,
    bio: "저녁 산책 좋아해요 🐶",
    avatarUrl: null,
    heartsCount: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  neighborhood: null,
};
