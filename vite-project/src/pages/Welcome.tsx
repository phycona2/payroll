import React from 'react';
import SplineRobot from '../components/Spline/SplineRobot';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface WelcomeProps {
  onTabChange: (tab: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onTabChange }) => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
    },
    tap: {
      scale: 0.95
    }
  };

  // Add this function to generate random stars
  const generateStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 0.5,
      size: Math.random() * 0.5 + 0.5, // Random size between 0.5 and 1
    }));
  };

  // Create 5 random stars
  const stars = generateStars(5);

  return (
    <div className="w-full aspect-[16/9] flex relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-black z-0" />

      {/* Text Content */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-12 z-10"
        style={{ transform: 'translateX(10vh)' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            <span className="inline-flex items-center">
              Welcome to{' '}
              <span className="magic ml-2 relative inline-flex items-center">
                {stars.map((star) => (
                  <motion.span 
                    key={star.id}
                    className="magic-star absolute"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, star.size, 0],
                      rotate: [0, 180]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.2,
                      times: [0, 0.5, 1],
                      delay: star.delay,
                      ease: "easeInOut"
                    }}
                    style={{ 
                      left: star.left, 
                      top: star.top,
                      transform: `translate(-50%, -50%)`
                    }}
                  >
                    <svg 
                      viewBox="0 0 512 512" 
                      className={`h-${Math.ceil(star.size * 4)} w-${Math.ceil(star.size * 4)}`}
                      style={{
                        color: `var(--${Math.random() > 0.5 ? 'pink' : Math.random() > 0.5 ? 'purple' : 'violet'})`
                      }}
                    >
                      <path 
                        fill="currentColor" 
                        d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" 
                      />
                    </svg>
                  </motion.span>
                ))}
                <span className="magic-text">
                  Payroll
                </span>
              </span>
            </span>
          </h1>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="max-w-xl"
        >
          <p className="text-left text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed">
            A simple and efficient system for managing salaries, taxes, and employee payments. 
            Automate payroll processing, reduce errors, and ensure smooth salary distribution with ease.
          </p>
        </motion.div>

        <motion.div className="flex gap-4" variants={itemVariants}>
          <motion.button 
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold 
              py-3 md:py-4 px-6 md:px-8 rounded-xl shadow-lg
              backdrop-blur-md border border-white/10"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span className="flex items-center gap-2">
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </motion.button>

          <motion.button 
            onClick={() => navigate('/login')}
            className="bg-white/10 text-white font-semibold 
              py-3 md:py-4 px-6 md:px-8 rounded-xl
              backdrop-blur-md border border-white/10 hover:bg-white/20"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div 
          className="flex flex-wrap gap-3 mt-8"
          variants={itemVariants}
        >
          {['Automated Processing', 'Tax Management', 'Real-time Updates'].map((feature, index) => (
            <div 
              key={index}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md 
                border border-white/10 text-sm text-gray-300"
            >
              {feature}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Spline Scene with Animation */}
      <motion.div 
        className="w-full h-full relative z-5"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ transform: 'translateX(40vh)' }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent opacity-50" />
        <SplineRobot />
      </motion.div>
    </div>
  );
};

export default Welcome; 