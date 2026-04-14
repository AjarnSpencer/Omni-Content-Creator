/**
 * Video Generation Service
 * Merges a static image (infographic) with an audio file into an MP4 video.
 * Uses MediaRecorder API for client-side encoding.
 */

export const createVideoFromImagesAndAudio = async (
  slides: { imageUrl: string; svgContent: string | null; audioBlob?: Blob }[],
  width: number = 1920,
  height: number = 1080,
  onStatusChange?: (status: string) => void
): Promise<{ videoUrl: string; blob: Blob }> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (onStatusChange) onStatusChange("Preparing canvas...");
      // 1. Setup Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // 2. Load All Images
      if (onStatusChange) onStatusChange("Loading images...");
      const loadedSlides = await Promise.all(slides.map(async (s) => {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        
        let isLoaded = false;
        if (s.imageUrl) {
          await new Promise((res) => {
            bgImg.onload = () => {
              isLoaded = true;
              res(null);
            };
            bgImg.onerror = () => {
              console.warn("Failed to load background image for video, using solid color fallback");
              res(null);
            };
            bgImg.src = s.imageUrl;
          });
        }

        let svgImg: HTMLImageElement | null = null;
        if (s.svgContent) {
          svgImg = new Image();
          // Ensure SVG has correct dimensions and styles before drawing
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(s.svgContent, "image/svg+xml");
          const svgEl = svgDoc.querySelector("svg");
          if (svgEl) {
            svgEl.setAttribute("width", width.toString());
            svgEl.setAttribute("height", height.toString());
            if ('style' in svgEl && (svgEl as any).style) {
              (svgEl as any).style.background = "transparent";
            } else {
              svgEl.setAttribute("style", "background: transparent");
            }
          }
          const serializedSvg = new XMLSerializer().serializeToString(svgDoc);
          const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          await new Promise((res) => {
            svgImg!.onload = () => {
              URL.revokeObjectURL(url);
              res(null);
            };
            svgImg!.onerror = () => {
              console.warn("Failed to load SVG for video slide");
              res(null);
            };
            svgImg!.src = url;
          });
        }
        return { bgImg, isLoaded, svgImg, audioBlob: s.audioBlob };
      }));

      // 3. Setup Audio Context and Decode ALL Audio Blobs
      if (onStatusChange) onStatusChange("Decoding audio...");
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContext.resume();
      
      const decodedSlides = await Promise.all(loadedSlides.map(async (s, idx) => {
        if (!s.audioBlob) {
          console.log(`[Video] Slide ${idx + 1} has no audio, using default 2s duration.`);
          return { ...s, audioBuffer: null, duration: 2 };
        }
        const arrayBuffer = await s.audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`[Video] Slide ${idx + 1} audio decoded: ${audioBuffer.duration}s`);
        return { ...s, audioBuffer, duration: audioBuffer.duration };
      }));

      const totalDuration = decodedSlides.reduce((acc, s) => acc + s.duration, 0);
      console.log(`Audio decoded. Total Duration: ${totalDuration}s`);

      // Create a single destination for all audio
      const destination = audioContext.createMediaStreamDestination();
      
      // 4. Setup MediaRecorder
      console.log("Setting up MediaRecorder...");
      const canvasStream = canvas.captureStream(30);
      const audioStream = destination.stream;
      
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')
        ? 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
              ? 'video/webm;codecs=vp8,opus'
              : 'video/webm';
      
      console.log(`Using mimeType: ${mimeType}`);
      
      const recorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: 5000000 
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        console.log(`Recorder stopped. Total chunks: ${chunks.length}`);
        if (onStatusChange) onStatusChange("Finalizing video...");
        const videoBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        console.log(`Video generated: ${videoUrl} (${videoBlob.size} bytes)`);
        audioContext.close();
        resolve({ videoUrl, blob: videoBlob });
      };

      // 5. Start Recording and Sequential Playback
      if (onStatusChange) onStatusChange("Recording video...");
      recorder.start(1000);
      
      let currentSlideIdx = 0;
      let slideStartTime = audioContext.currentTime;

      const playNextSlide = () => {
        if (currentSlideIdx >= decodedSlides.length) {
          console.log("[Video] All slides played, stopping recorder.");
          setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
          }, 500);
          return;
        }

        const slide = decodedSlides[currentSlideIdx];
        console.log(`[Video] Playing slide ${currentSlideIdx + 1} (Duration: ${slide.duration}s)`);
        if (slide.audioBuffer) {
          const source = audioContext.createBufferSource();
          source.buffer = slide.audioBuffer;
          source.connect(destination);
          source.connect(audioContext.destination);
          
          source.onended = () => {
            currentSlideIdx++;
            slideStartTime = audioContext.currentTime;
            playNextSlide();
          };
          
          source.start(0);
        } else {
          // If no audio, wait for default duration
          setTimeout(() => {
            currentSlideIdx++;
            slideStartTime = audioContext.currentTime;
            playNextSlide();
          }, slide.duration * 1000);
        }
      };

      playNextSlide();

      // 6. Animation Loop for Visuals
      const drawFrame = () => {
        if (recorder.state === 'inactive') return;

        const slide = decodedSlides[Math.min(currentSlideIdx, decodedSlides.length - 1)];
        ctx.clearRect(0, 0, width, height);

        if (slide.isLoaded) {
          ctx.drawImage(slide.bgImg, 0, 0, width, height);
        } else {
          ctx.fillStyle = '#1a1005';
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.fillStyle = 'rgba(42, 10, 10, 0.2)';
        ctx.fillRect(0, 0, width, height);

        if (slide.svgImg) {
          ctx.drawImage(slide.svgImg, 0, 0, width, height);
        }
        
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

    } catch (err) {
      reject(err);
    }
  });
};
