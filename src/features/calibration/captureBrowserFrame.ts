/** Validate a real frame in memory. No image is persisted or uploaded. */
export async function captureBrowserFrame(video: HTMLVideoElement | null, stream: MediaStream | null, page: Document = document): Promise<void> {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight || video.paused || !stream?.getVideoTracks().some(track => track.readyState === 'live' && !track.muted) || page.hidden) {
    throw new Error('Camera is not ready. Reconnect it and try again.');
  }
  const canvas = page.createElement('canvas');
  try {
    canvas.width = 320;
    canvas.height = Math.round(320 * video.videoHeight / video.videoWidth);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not capture a reference frame.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    await new Promise<void>((resolve, reject) => canvas.toBlob(blob => blob?.size ? resolve() : reject(new Error('The reference frame was empty. Please retry.')), 'image/jpeg', .5));
  } finally { canvas.width = 0; canvas.height = 0; }
}
