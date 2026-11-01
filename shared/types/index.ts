export interface Media {
  src: string;
  alt: string;
}
export interface Project {
  boardPreview?: Media & {
    width: number;
    height: number;
    shape?: "disc" | "phone" | "image";
  };
  id: string;
  channel: number;
  title: string;
  category: string;
  description: string;
  sample: boolean;
  thumbnail: Media;
  images: Media[];
  video?: string;
  technologies: string[];
  liveUrl?: string;
  sourceUrl?: string;
  position: { x: number; y: number; rotation: number };
  accent?: string;
}
export interface Profile {
  name: string;
  role: string;
  introduction: string;
  supportingText: string;
  email?: string;
  availability?: string;
  socials: { label: string; url: string }[];
}
export interface Portfolio {
  profile: Profile;
  projects: Project[];
}
export interface ApiError {
  error: { code: string; message: string };
}
