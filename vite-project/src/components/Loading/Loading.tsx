import React from 'react';
import Lottie from 'lottie-react';
import animationData from './Loading.json';

const Loading: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <div className="w-64 h-64"> {/* Adjust size as needed */}
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
};

export default Loading; 