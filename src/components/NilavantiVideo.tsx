import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface NilavantiVideoProps {
  onVideoEnd?: () => void;
}

export function NilavantiVideo({ onVideoEnd }: NilavantiVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const requestFullscreen = async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Error attempting to enable fullscreen:', error);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playVideo = async () => {
        try {
          await video.play();
          await requestFullscreen();
        } catch (error) {
          console.error('Error playing video:', error);
          const playButton = document.createElement('button');
          playButton.textContent = 'Play Video';
          playButton.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded';
          playButton.onclick = async () => {
            try {
              await video.play();
              await requestFullscreen();
              playButton.remove();
            } catch (err) {
              console.error('Error playing video:', err);
            }
          };
          if (containerRef.current) {
            containerRef.current.appendChild(playButton);
          }
        }
      };

      const handleEnded = () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }
        if (onVideoEnd) {
          onVideoEnd();
        } else {
          navigate('/projects/nilavanti/main');
        }
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          navigate('/projects/nilavanti/main');
        }
      };

      playVideo();
      
      video.addEventListener('ended', handleEnded);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        video.removeEventListener('ended', handleEnded);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [navigate]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center w-screen h-screen"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src="/src/assets/Nilavanti.mp4"
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        controls={false}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
