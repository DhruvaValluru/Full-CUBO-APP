import type { HeadDirection } from '../types/app';

export type FaceTrackingSnapshot = {
  headDirection: HeadDirection;
  distracted: boolean;
  eyeGaze: string;
  detectionStatus: string;
  focusScore: number;
  dwellMs: number;
  facePresent: boolean;
  error: string | null;
  ready: boolean;
};

export type UseWebFaceLandmarksResult = FaceTrackingSnapshot & {
  setHost: (node: HTMLElement | null) => void;
  retry?: () => void;
};

/**
 * Native stub — Metro uses `useWebFaceLandmarks.web.ts` on web.
 */
export function useWebFaceLandmarks(): UseWebFaceLandmarksResult {
  return {
    setHost: () => {},
    headDirection: 'Forward',
    distracted: false,
    eyeGaze: 'On-road',
    detectionStatus: 'Unavailable on native',
    focusScore: 0,
    dwellMs: 0,
    facePresent: false,
    error: null,
    ready: false,
  };
}
