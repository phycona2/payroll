import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState, useRef } from 'react';

export default function SplineFlow() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const splineRef = useRef<Application | null>(null);

  const handleLoad = (splineApp: Application) => {
    setIsLoading(false);
    setError(null);
    splineRef.current = splineApp;

    // Add mouse move effect
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
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load 3D scene');
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Spline Scene */}
      <Spline
        scene="https://prod.spline.design/Gw75i0Od6fbJfPvo/scene.splinecode"
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoading ? 0 : 1 }}
        className="transition-opacity duration-300"
      />
    </div>
  );
}
