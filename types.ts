import { Vector3, Euler } from 'three';

export interface FrameData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
  defaultImage?: string;
}

export interface ImageState {
  [key: string]: string;
}

export interface GalleryContextType {
  images: ImageState;
  hoveredFrame: string | null;
  setHoveredFrame: (id: string | null) => void;
}