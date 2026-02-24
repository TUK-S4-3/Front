
export type PublicGalleryItem = {
  id: number | string;
  title?: string;
  createdAt?: string;

  previewVideoUrl: string;


  fullVideoUrl?: string;

  shareUrl?: string;

  posterUrl?: string;
};


// mock
const MOCK: PublicGalleryItem[] = [
  {
    id: 1,
    title: "Scan_0001",
    createdAt: new Date().toISOString(),
    previewVideoUrl: "/demo/demo1.mp4",

  },
];


// 백엔드 API로 교체 예정
export async function getPublicGallery(): Promise<{ items: PublicGalleryItem[] }> {

  return { items: MOCK };

  // --- REAL API---
}

export async function getPublicGalleryItem(
  id: number
): Promise<{ item: PublicGalleryItem | null }> {

  const item = MOCK.find((x) => Number(x.id) === id) ?? null;
  return { item };
  
}
