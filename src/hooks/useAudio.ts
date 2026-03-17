import { useEffect, useRef, useState } from 'react';

export const useAudio = (audioPath?: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<{ beat: number; frequencies: number[] }>({
    beat: 0,
    frequencies: []
  });
  
  useEffect(() => {
    if (!audioPath) return;
    
    // Create audio element
    const audio = new Audio(audioPath);
    audio.loop = true;
    audioRef.current = audio;
    
    // Create Web Audio API context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    
    return () => {
      audio.pause();
      audioContext.close();
    };
  }, [audioPath]);
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const updateAudioData = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate beat (average of low frequencies)
    const lowFreqSum = dataArrayRef.current.slice(0, 20).reduce((a, b) => a + b, 0);
    const beat = lowFreqSum / (20 * 255); // Normalize 0-1
    
    // Get frequency spectrum
    const frequencies = Array.from(dataArrayRef.current).map(v => v / 255);
    
    setAudioData({ beat, frequencies });
  };
  
  return { isPlaying, togglePlay, audioData, updateAudioData };
};
