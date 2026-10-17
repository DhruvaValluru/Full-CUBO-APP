// Model files are downloaded; camera samples only cross the local WebView bridge.
export const nativeDetectorHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width" /></head><body><script type="module">
const send = value => window.ReactNativeWebView.postMessage(JSON.stringify(value));
// Keep this explicit: Hermes does not guarantee serializable Function.toString().
const metrics = points => {
  const missing = { face: false, yaw: 0, pitch: 0, eyes: 0, width: 0, x: 0, y: 0 };
  if (!points || points.length < 455) return missing;
  const distance = (a, b) => Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
  const left = points[234], right = points[454], nose = points[1];
  const width = distance(234, 454);
  if (width < .08) return missing;
  const eyes = ((distance(159, 145) / Math.max(.001, distance(33, 133))) + (distance(386, 374) / Math.max(.001, distance(362, 263)))) / 2;
  const result = { face: true, yaw: (nose.x - (left.x + right.x) / 2) / width, pitch: (nose.y - (left.y + right.y) / 2) / width, eyes, width, x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  return Object.values(result).every(v => typeof v !== 'number' || Number.isFinite(v)) ? result : missing;
};
try {
  const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  const detector = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'CPU' }, runningMode: 'IMAGE', numFaces: 1 });
  window.analyzeImage = async (data, at) => {
    try { const image = new Image(); image.src = data; await image.decode(); const result = detector.detect(image); image.src = ''; send({ type: 'sample', sample: { ...metrics(result.faceLandmarks[0]), at } }); }
    catch { send({ type: 'error' }); }
  };
  send({ type: 'ready' });
} catch { send({ type: 'error' }); }
</script></body></html>`;
