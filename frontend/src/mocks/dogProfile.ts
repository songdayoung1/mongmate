export type DogProfileMock = {
  id: number;
  guardianUserId: number;
  name: string;
  breed: string | null;
  ageYears: number | null;
  genderCode: "M" | "F" | null;
  isNeutered: boolean | null;
  vaccinationNote: string | null;
  dispositionText: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export const dogProfile: DogProfileMock[] = [
  {
    id: 1,
    guardianUserId: 1,
    name: "콩이",
    breed: "말티즈",
    ageYears: 3,
    genderCode: "M",
    isNeutered: true,
    vaccinationNote: "기본 접종 완료",
    dispositionText: "활발/사람좋아",
    photoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
