import Spline from '@splinetool/react-spline';
import { useRef } from 'react';

export default function SplinePartical() {
  const splineRef = useRef(null);

  // Handle scene load and setup interactions
  const onLoad = (splineApp: any) => {
    if (splineApp) {
      splineRef.current = splineApp;
      
      // Optional: Add mouse move effect
      document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate normalized mouse position (-1 to 1)
        const normalizedX = (clientX / windowWidth) * 2 - 1;
        const normalizedY = (clientY / windowHeight) * 2 - 1;
        
        // Apply subtle movement to the scene
        if (splineApp.setVariable) {
          splineApp.setVariable('mouseX', normalizedX * 0.1);
          splineApp.setVariable('mouseY', normalizedY * 0.1);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20 z-10" />
      <div className="absolute inset-0 w-full h-full">
        <Spline
          scene="https://prod.spline.design/X1uOdwYpvj1xPqCZ/scene.splinecode"
          onLoad={onLoad}
          className="w-full h-full"
          style={{
            transform: 'scale(1.1)', // Slight scale to ensure coverage
            opacity: 0.6, // Reduce opacity to not overwhelm content
          }}
        />
      </div>
    </div>
  );
}
