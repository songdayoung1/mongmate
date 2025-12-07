import { create } from "zustand";

export type PostType = "WALK" | "DOG_CAFE";

export type HomePost = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  deadlineText: string;
  authorNickname: string;
  content: string;
  placeName?: string;
  createdAt: string;
};

type PostStore = {
  posts: HomePost[];
  addPost: (input: Omit<HomePost, "id" | "createdAt">) => void;
};

const nowIso = () => new Date().toISOString();

const initialPosts: HomePost[] = [
  {
    id: "1",
    type: "WALK",
    title: "저녁 한강 산책 같이 하실 분 구해요 🐾",
    region: "마포구 성산동",
    deadlineText: "오늘 20:00까지",
    authorNickname: "멍멍맘",
    content: "합정역 근처에서 만나서 한강 따라 1~2시간 정도 가볍게 걸어요.",
    placeName: "망원한강공원 입구",
    createdAt: nowIso(),
  },
  {
    id: "2",
    type: "DOG_CAFE",
    title: "주말 애견카페 같이 가실 분 ☕",
    region: "마포구 연남동",
    deadlineText: "토요일 오후까지",
    authorNickname: "두부아빠",
    content: "연남동 애견카페에서 소형견 위주로 편하게 이야기 나눠요.",
    placeName: "연남동 OO 애견카페",
    createdAt: nowIso(),
  },
  {
    id: "3",
    type: "WALK",
    title: "아침 출근 전 가벼운 산책 같이 하실 분",
    region: "마포구 망원동",
    deadlineText: "이번 주 내",
    authorNickname: "출근전산책러",
    content: "평일 오전 7시 망원역 근처에서 30분 정도 같이 걸어요.",
    placeName: "망원역 2번 출구 앞",
    createdAt: nowIso(),
  },
  {
    id: "4",
    type: "WALK",
    title: "소형견 위주 동네 한 바퀴 산책",
    region: "마포구 성산동",
    deadlineText: "내일 저녁까지",
    authorNickname: "콩이엄마",
    content: "소형견들끼리 조용히 동네 한 바퀴 도는 산책입니다.",
    placeName: "성산동 주민센터 앞",
    createdAt: nowIso(),
  },
  {
    id: "5",
    type: "DOG_CAFE",
    title: "비 오는 날 애견카페 모임",
    region: "마포구 도화동",
    deadlineText: "이번 주말",
    authorNickname: "비오는날좋아",
    content: "비 오는 날 실내에서 강아지들끼리 놀게 해줘요.",
    placeName: "도화동 실내 애견카페",
    createdAt: nowIso(),
  },
  {
    id: "6",
    type: "WALK",
    title: "강아지 사회성 키우기 산책 모임",
    region: "마포구 상암동",
    deadlineText: "금요일 저녁까지",
    authorNickname: "사회성키우자",
    content: "사람, 강아지에 아직 어색한 아이들 위주로 천천히 걸어요.",
    placeName: "상암 월드컵공원 입구",
    createdAt: nowIso(),
  },
  {
    id: "7",
    type: "WALK",
    title: "주말 낮 한강 피크닉 산책",
    region: "마포구 토정동",
    deadlineText: "토요일 11:00까지",
    authorNickname: "피크닉좋아",
    content: "돗자리 펴고 간단히 쉬면서 걷고 먹고 하는 산책입니다.",
    placeName: "토정동 한강공원 피크닉존",
    createdAt: nowIso(),
  },
  {
    id: "8",
    type: "DOG_CAFE",
    title: "중대형견 환영 애견카페 모임",
    region: "마포구 공덕동",
    deadlineText: "이번 주말 오후",
    authorNickname: "대형견집사",
    content: "중대형견 친구들과 에너지를 마음껏 발산시키는 모임이에요.",
    placeName: "공덕역 근처 대형견 가능 카페",
    createdAt: nowIso(),
  },
  {
    id: "9",
    type: "WALK",
    title: "저녁 8시 이후 늦은 산책 메이트 구해요",
    region: "마포구 아현동",
    deadlineText: "오늘 22:00까지",
    authorNickname: "야행성보호자",
    content: "퇴근하고 8시 이후에만 시간이 되시는 분들 환영해요.",
    placeName: "아현역 3번 출구 앞",
    createdAt: nowIso(),
  },
  {
    id: "10",
    type: "WALK",
    title: "주말 가족 산책 모임 (아이 동반 가능)",
    region: "마포구 염리동",
    deadlineText: "일요일 오전까지",
    authorNickname: "가족산책러",
    content: "아이들과 강아지들이 함께 어울릴 수 있는 가족 산책 모임입니다.",
    placeName: "염리동 어린이공원 앞",
    createdAt: nowIso(),
  },
];

export const usePostStore = create<PostStore>((set) => ({
  posts: initialPosts,
  addPost: (input) =>
    set((state) => ({
      posts: [
        {
          ...input,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        },
        ...state.posts,
      ],
    })),
}));
