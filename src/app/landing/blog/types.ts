export type Category = 'guide' | 'technique' | 'other';
export interface Article {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  author: string;
  content: string;
  coverImageId: string;
  coverImageAlt: string;
  youtubeVideoId?: string;
  category: Category;
  tags: string[];
  faqs?: { question: string; answer: string }[];
}
