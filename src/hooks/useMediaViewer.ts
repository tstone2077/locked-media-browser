
import { useState } from "react";

export const useMediaViewer = () => {
  const [mediaViewer, setMediaViewer] = useState<{ fileIdx: number; open: boolean }>({ 
    fileIdx: -1, 
    open: false 
  });

  const openMediaViewer = (fileIdx: number) => {
    setMediaViewer({ fileIdx, open: true });
  };

  const closeMediaViewer = () => {
    setMediaViewer(prev => ({ ...prev, open: false }));
  };

  const navigatePrev = (minIdx: number = 0) => {
    setMediaViewer(prev => ({
      fileIdx: Math.max(minIdx, prev.fileIdx - 1),
      open: true
    }));
  };

  const navigateNext = (maxIdx: number) => {
    setMediaViewer(prev => ({
      fileIdx: Math.min(maxIdx, prev.fileIdx + 1),
      open: true
    }));
  };

  return {
    mediaViewer,
    setMediaViewer,
    openMediaViewer,
    closeMediaViewer,
    navigatePrev,
    navigateNext
  };
};
