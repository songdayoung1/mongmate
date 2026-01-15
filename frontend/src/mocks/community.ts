export type CommunityPost = {
  id: string;
  authorName: string;
  authorAvatar?: string;
  location: string;
  createdAtLabel: string; // "방금", "1시간 전"
  title: string;
  content: string;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  isRecruiting?: boolean; // 모집중 UI용
};

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "p1",
    authorName: "코코 보호자",
    authorAvatar:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
    location: "잠실 · 한강공원",
    createdAtLabel: "방금",
    title: "오늘 저녁 7시 산책 메이트 구해요",
    content:
      "코코(말티푸, 2살)랑 가볍게 한 바퀴 돌 예정이에요. 강아지 친화적이면 더 좋아요!",
    tags: ["소형견", "친화적", "가벼운 산책"],
    likeCount: 12,
    commentCount: 4,
    isRecruiting: true,
  },
  {
    id: "p2",
    authorName: "몽이 아빠",
    authorAvatar:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop",
    location: "송파 · 석촌호수",
    createdAtLabel: "1시간 전",
    title: "석촌호수 한 바퀴 같이 걸으실 분!",
    content:
      "몽이(푸들) 사회성 훈련 겸 산책하려고요. 리드줄 필수, 간식은 제가 챙길게요 😄",
    tags: ["중형견", "훈련", "석촌호수"],
    likeCount: 7,
    commentCount: 2,
    isRecruiting: true,
  },
  {
    id: "p3",
    authorName: "동네 산책 모임",
    authorAvatar:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
    location: "강남 · 대모산",
    createdAtLabel: "어제",
    title: "주말 단체 산책 공지",
    content:
      "이번 주말 오전 10시 대모산 입구에서 모여요! 처음 오시는 분도 환영합니다.",
    tags: ["단체", "주말", "모임"],
    likeCount: 31,
    commentCount: 9,
    isRecruiting: false,
  },
];
