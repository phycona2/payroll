import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState } from 'react';

const SplineRobo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = (splineApp: Application) => {
    setIsLoading(false);
    setError(null);
    console.log('Spline scene loaded');
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load 3D scene');
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <Spline
        scene="https://prod.spline.design/dTvTkICWDSC9MRnD/scene.splinecode"
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoading ? 0 : 1 }}
        className="transition-opacity duration-300"
      />
    </div>
  );
};

export default SplineRobo;
