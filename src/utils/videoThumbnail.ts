
export const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Set video properties for better loading
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      console.log('[VideoThumbnail] Video metadata loaded', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      console.log('[VideoThumbnail] Seeking to time:', seekTime);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      console.log('[VideoThumbnail] Video seeked, drawing to canvas');
      
      // Clear canvas first
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailUrl = URL.createObjectURL(blob);
          console.log('[VideoThumbnail] Thumbnail generated successfully');
          resolve(thumbnailUrl);
        } else {
          reject(new Error('Failed to generate thumbnail blob'));
        }
      }, 'image/jpeg', 0.8);
    });

    video.addEventListener('error', (e) => {
      console.error('[VideoThumbnail] Video error:', e);
      reject(new Error('Failed to load video for thumbnail generation'));
    });

    video.addEventListener('loadeddata', () => {
      console.log('[VideoThumbnail] Video data loaded');
    });

    // Set video source and load
    video.src = videoUrl;
    video.load();
  });
};
