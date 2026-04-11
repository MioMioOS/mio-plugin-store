export type PluginType = "theme" | "buddy" | "sound";

export interface Plugin {
  id: string;
  type: PluginType;
  name: string;
  name_en: string;
  author: string;
  author_github: string;
  avatar_url?: string;
  price: number; // 0 = free
  description: string;
  description_en: string;
  tags: string[];
  downloads: number;
  rating: number;
  version: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  preview?: {
    colors?: string[];
    image_url?: string;
  };
  versions?: {
    version: string;
    notes: string;
    created_at: string;
  }[];
  featured?: boolean;
}
