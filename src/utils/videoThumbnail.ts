
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

    video.addEventListener('loadeddata', () => {
      console.log('[VideoThumbnail] Video data loaded', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Wait a bit for the video to render, then capture
      setTimeout(() => {
        console.log('[VideoThumbnail] Capturing frame after delay');
        
        // Don't clear with background color - let the video provide the content
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
      }, 100); // Small delay to let video render
    });

    video.addEventListener('error', (e) => {
      console.error('[VideoThumbnail] Video error:', e);
      reject(new Error('Failed to load video for thumbnail generation'));
    });

    // Set video source and load
    video.src = videoUrl;
    video.load();
  });
};
