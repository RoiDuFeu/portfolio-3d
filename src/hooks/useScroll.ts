import { useEffect, useState } from 'react';

export const useScroll = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  
  useEffect(() => {
    let lastScrollX = window.scrollX;
    
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollWidth - window.innerWidth;
      const progress = window.scrollX / maxScroll;
      setScrollProgress(progress);
      
      // Detect scroll direction
      if (window.scrollX > lastScrollX) {
        setScrollDirection('right');
      } else if (window.scrollX < lastScrollX) {
        setScrollDirection('left');
      }
      lastScrollX = window.scrollX;
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return { scrollProgress, scrollDirection };
};
