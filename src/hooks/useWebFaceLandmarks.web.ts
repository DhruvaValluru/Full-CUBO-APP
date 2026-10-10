import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { HeadDirection } from '../types/app';
import type { FaceTrackingSnapshot, UseWebFaceLandmarksResult } from './useWebFaceLandmarks';

const NOSE = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const YAW_THRESH = 0.14;

function classifyYaw(yaw: number): HeadDirection {
  if (yaw > YAW_THRESH) {
    return 'Right';
  }
  if (yaw < -YAW_THRESH) {
    return 'Left';
  }
  return 'Forward';
}

/**
 * Web only: webcam + MediaPipe Face Landmarker.
 * `setHost` must be passed as `ref` to a `View` (RN Web → div) that fills the camera area.
 */
export function useWebFaceLandmarks(): UseWebFaceLandmarksResult {
  const [state, setState] = useState<FaceTrackingSnapshot>({
    headDirection: 'Forward',
    distracted: false,
    eyeGaze: 'On-road',
    detectionStatus: 'Starting camera…',
    focusScore: 100,
    dwellMs: 0,
    facePresent: false,
    error: null,
    ready: false,
  });

  const hostRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<{ close: () => void; detectForVideo: (video: HTMLVideoElement, ts: number) => unknown } | null>(
    null,
  );
  const distractedSinceRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const generationRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    generationRef.current += 1;
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      if (videoRef.current.parentElement) {
        videoRef.current.remove();
      }
      videoRef.current = null;
    }
    startedRef.current = false;
  }, [stopLoop]);

  const setHost = useCallback(
    (node: HTMLElement | null) => {
      hostRef.current = node;
      if (Platform.OS !== 'web') {
        return;
      }

      if (!node) {
        teardown();
        setState((s: FaceTrackingSnapshot) => ({
          ...s,
          ready: false,
          detectionStatus: 'Stopped',
        }));
        return;
      }

      if (startedRef.current) {
        return;
      }
      startedRef.current = true;
      const generation = ++generationRef.current;

      void (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (generation !== generationRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
          streamRef.current = stream;

          const video = document.createElement('video');
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.muted = true;
          video.autoplay = true;
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.transform = 'scaleX(-1)';
          video.srcObject = stream;
          node.innerHTML = '';
          node.appendChild(video);
          await video.play();
          if (generation !== generationRef.current) { stream.getTracks().forEach(track => track.stop()); video.remove(); return; }
          videoRef.current = video;
          setState(s => ({ ...s, detectionStatus: 'Camera live', ready: true, error: null }));
          const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

          const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
          );

          const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
          });

          if (generation !== generationRef.current) { faceLandmarker.close(); return; }
          landmarkerRef.current = faceLandmarker;



          const predict = () => {
            if (!video || !landmarkerRef.current) {
              return;
            }
            if (video.readyState < 2) {
              rafRef.current = requestAnimationFrame(predict);
              return;
            }

            const result = landmarkerRef.current.detectForVideo(video, performance.now()) as {
              faceLandmarks?: { x: number; y: number; z?: number }[][];
            };

            const face = result.faceLandmarks?.[0];
            if (!face) {
              distractedSinceRef.current = null;
              setState((s: FaceTrackingSnapshot) => ({
                ...s,
                facePresent: false,
                headDirection: 'Forward',
                distracted: false,
                eyeGaze: '—',
                detectionStatus: 'No face in frame',
                focusScore: 0,
                dwellMs: 0,
                ready: true,
                error: null,
              }));
              rafRef.current = requestAnimationFrame(predict);
              return;
            }

            const nose = face[NOSE];
            const left = face[LEFT_CHEEK];
            const right = face[RIGHT_CHEEK];
            const midX = (left.x + right.x) / 2;
            const spread = Math.max(Math.abs(right.x - left.x), 0.08);
            const yaw = (nose.x - midX) / spread;
            const headDirection = classifyYaw(yaw);
            const distracted = headDirection !== 'Forward';
            const now = performance.now();

            if (distracted) {
              if (distractedSinceRef.current == null) {
                distractedSinceRef.current = now;
              }
            } else {
              distractedSinceRef.current = null;
            }

            const dwellMs =
              distracted && distractedSinceRef.current != null ? Math.round(now - distractedSinceRef.current) : 0;

            const focusScore = distracted ? Math.max(40, Math.round(100 - Math.min(60, Math.abs(yaw) * 120))) : 96;
            const eyeGaze = distracted ? 'Off-road' : 'On-road';
            const detectionStatus = distracted ? 'Driver Distracted' : 'Focused';

            setState({
              headDirection,
              distracted,
              eyeGaze,
              detectionStatus,
              focusScore,
              dwellMs,
              facePresent: true,
              error: null,
              ready: true,
            });

            rafRef.current = requestAnimationFrame(predict);
          };

          setState((s: FaceTrackingSnapshot) => ({ ...s, detectionStatus: 'Camera live', ready: true, error: null }));
          rafRef.current = requestAnimationFrame(predict);
        } catch (e) {
          if (generation !== generationRef.current) return;
          startedRef.current = false;
          const message = e instanceof Error ? e.message : 'Camera or model failed to start';
          setState((s: FaceTrackingSnapshot) => ({
            ...s,
            error: message,
            detectionStatus: 'Unavailable',
            ready: videoRef.current != null,
          }));
        }
      })();
    },
    [teardown],
  );

  const retry = useCallback(() => { const host = hostRef.current; teardown(); setState(s => ({ ...s, ready: false, error: null, detectionStatus: 'Requesting camera access' })); if (host) setHost(host); }, [teardown, setHost]);
  return { setHost, retry, ...state } satisfies UseWebFaceLandmarksResult;
}
