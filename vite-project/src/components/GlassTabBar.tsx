import React, { useState } from 'react';
import './GlassTabBar.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence, Variants } from 'framer-motion';

interface GlassTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface CashParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
}

const GlassTabBar: React.FC<GlassTabBarProps> = ({ activeTab, onTabChange }) => {
  const { isAuthenticated, isAdmin, logout, adminLogout } = useAuth();
  const navigate = useNavigate();
  const controls = useAnimation();

  // Define tab groups
  const publicTabs = [
    { id: 'welcome', label: 'Welcome', icon: '👋' },
    { id: 'login', label: 'Login', icon: '🔑' },
    { id: 'register', label: 'Register', icon: '📝' },
    { id: 'adminlogin', label: 'Admin Login', icon: '👑' }
  ];

  const employeeTabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'attendance', label: 'Attendance', icon: '⏱️' },
    { id: 'leaves', label: 'Leaves', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const adminTabs = [
    { id: 'admin/dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'admin/employees', label: 'Employees', icon: '👥' },
    { id: 'admin/payroll', label: 'Payroll', icon: '💰' },
    { id: 'admin/leaves', label: 'Leaves', icon: '📅' },
    { id: 'admin/attendance', label: 'Attendance', icon: '⏱️' }
  ];

  // Determine which tabs to show based on auth status
  const visibleTabs = isAdmin 
    ? adminTabs 
    : isAuthenticated 
      ? employeeTabs 
      : publicTabs;

  // Simplified handleTabClick - only handles tab change and animation
  const handleTabClick = async (tabId: string) => {
    onTabChange(tabId);
    
    // Only animate if it's a dashboard tab
    if (tabId === 'admin/dashboard' || tabId === 'home') {
      const element = document.querySelector(`button[data-tab-id="${tabId}"] .tab-icon`);
      if (element) {
        element.classList.add('animate-bounce-once');
        setTimeout(() => {
          element.classList.remove('animate-bounce-once');
        }, 500);
      }
    }
  };

  // Simplify handleSignOut by removing animation
  const handleSignOut = async () => {
    if (isAdmin) {
      adminLogout();
      navigate('/');
    } else {
      logout();
      navigate('/');
    }
  };

  // Update the getIconAnimation function to ensure all rotation values are numbers
  const getIconAnimation = (tabId: string): Variants => {
    if (tabId === 'register') {
      return writingAnimation;
    } else if (tabId === 'welcome') {
      return welcomeWaveAnimation;
    } else if (tabId === 'login') {
      return lockAnimation;
    } else if (tabId === 'admin/employees') {
      return waveAnimation;
    } else if (tabId === 'admin/payroll') {
      return shimmerAnimation;
    } else if (tabId === 'admin/leaves') {
      return fireworkAnimation;
    } else if (tabId === 'adminlogin') {
      return crownAnimation;
    } else if (tabId === 'admin/attendance' || tabId === 'attendance') {
      return {
        active: {
          scale: [1, 1.2, 1],
          rotate: [0, 0, 0], // Ensure these are numbers
          transition: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: "mirror" as const
          }
        },
        inactive: {
          scale: 1,
          rotate: 0
        }
      };
    }
    return {};
  };

  const createCashRain = () => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // Wider spread from -100 to 100
      y: -20,
      rotation: Math.random() * 720 - 360, // More rotation range
      scale: Math.random() * 0.5 + 0.7, // Varied sizes
      delay: Math.random() * 0.5, // Add random delays
      duration: 1.5 + Math.random(), // Varied durations
    }));
  };

  const [cashParticles, setCashParticles] = useState<CashParticle[]>([]);

  const handleLogoClick = () => {
    setCashParticles(createCashRain());
    setTimeout(() => setCashParticles([]), 2000); // Clear particles after animation
  };

  // Add wave animation variant for Framer Motion
  const waveAnimation = {
    wave: {
      rotate: [0, -20, 20, -10, 10, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      }
    }
  };

  // Add shimmer animation variant for Framer Motion
  const shimmerAnimation = {
    shimmer: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 0.7,
        ease: "easeInOut",
      }
    }
  };

  // Add firework animation variant
  const fireworkAnimation = {
    firework: {
      scale: [1, 1.5, 0.8, 1],
      opacity: [1, 0.7, 0.9, 1],
      transition: {
        duration: 0.8,
        ease: "easeOut",
      }
    }
  };

  // Add confetti animation variant
  const confettiAnimation = {
    confetti: {
      y: [0, 100],
      opacity: [1, 0],
      scale: [1, 0.5],
      transition: {
        duration: 1.2,
        ease: "easeOut",
      }
    }
  };

  const createConfetti = (container: Element) => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * container.clientWidth,
      y: -20, // Start above the container
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      color: ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'][
        Math.floor(Math.random() * 5)
      ],
    }));
  };

  const [confetti, setConfetti] = React.useState<Array<any>>([]);

  // Update the welcomeWaveAnimation variant
  const welcomeWaveAnimation = {
    idle: {
      rotate: [-5, 5],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    active: {
      scale: [1, 1.2, 1],
      rotate: [0, -15, 15, -10, 10, 0],
      transition: {
        duration: 0.6,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: "easeInOut"
      }
    }
  };

  // Update the lockAnimation variant
  const lockAnimation = {
    idle: {
      y: [-2, 2],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    active: {
      rotate: [0, -8, 8, -8, 8, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.4,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: "easeInOut"
      }
    }
  };

  // Add this function to create confetti particles
  const createConfettiParticles = () => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      angle: (i * 45 * Math.PI) / 180, // 45° intervals
      distance: Math.random() * 20 + 30,
      duration: 0.6 + Math.random() * 0.4,
      color: '#FFD700'
    }));
  };

  // Add the writing animation variant (add near other animation variants)
  const writingAnimation = {
    write: {
      rotate: [-10, 15, -5, 0],
      scale: [1, 1.1, 0.95, 1],
      opacity: [1, 0.8, 0.9, 1],
      transition: {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.4, 0.7, 1]
      }
    }
  };

  // Add sparkle particle generator (add near createConfetti function)
  const createSparkles = (container: Element) => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * container.clientWidth,
      y: Math.random() * container.clientHeight,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 360,
      color: '#FFD700' // Gold color for sparkles
    }));
  };

  // Add sparkles state (near other state declarations)
  const [sparkles, setSparkles] = React.useState<Array<any>>([]);

  // Add the crown animation variant (add near other animation variants)
  const crownAnimation = {
    crown: {
      y: [0, -10, -8],
      scale: [1, 1.2, 1.1],
      rotate: [0, -5, 5, -3, 3, 0],
      opacity: [1, 0.7, 0.9],
      transition: {
        duration: 1,
        times: [0, 0.3, 1],
        ease: [0.19, 1, 0.22, 1],
      }
    }
  };

  // Update the handleIconClick function
  const handleIconClick = async (tabId: string) => {
    if (tabId === 'welcome') {
      // Create and animate confetti for welcome icon
      const container = document.querySelector(`button[data-tab-id="${tabId}"]`);
      if (container) {
        const particles = createConfettiParticles();
        particles.forEach(particle => {
          const element = document.createElement('div');
          element.className = 'confetti-particle';
          element.style.backgroundColor = particle.color;
          element.style.left = '50%';
          element.style.top = '50%';
          
          container.appendChild(element);
          
          // Animate the particle
          const animation = element.animate([
            {
              transform: 'translate(-50%, -50%) scale(0)',
              opacity: 1
            },
            {
              transform: `translate(
                calc(-50% + ${Math.cos(particle.angle) * particle.distance}px),
                calc(-50% + ${Math.sin(particle.angle) * particle.distance}px)
              ) scale(1)`,
              opacity: 0
            }
          ], {
            duration: particle.duration * 1000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          });
          
          animation.onfinish = () => element.remove();
        });
      }
      
      await controls.start('active');
      controls.start('idle');
    } else if (tabId === 'login') {
      await controls.start('active');
      
      // Add keyhole beam effect
      const icon = document.querySelector(`button[data-tab-id="${tabId}"] .tab-icon`);
      if (icon) {
        const beam = document.createElement('div');
        beam.style.cssText = `
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 0;
          background: linear-gradient(to bottom, #ffeb3b55, transparent);
          transform: translateX(-50%);
          pointer-events: none;
        `;
        
        icon.appendChild(beam);
        
        beam.animate([
          { height: '0', opacity: 0 },
          { height: '200%', opacity: 1 },
          { height: '200%', opacity: 0 }
        ], {
          duration: 400,
          easing: 'ease-out'
        }).onfinish = () => beam.remove();
      }
      
      controls.start('idle');
    } else if (tabId === 'register') {
      // Start writing animation
      await controls.start('write');
      controls.set({ rotate: 0, filter: 'none' });
      
      // Create sparkles
      const container = document.querySelector(`button[data-tab-id="${tabId}"]`);
      if (container) {
        setSparkles(createSparkles(container));
        
        // Clear sparkles after animation
        setTimeout(() => {
          setSparkles([]);
        }, 1000);
      }
    } else if (tabId === 'admin/employees') {
      await controls.start('wave');
      controls.set({ rotate: 0 });
    } else if (tabId === 'admin/payroll') {
      await controls.start('shimmer');
    } else if (tabId === 'admin/leaves') {
      // Start firework animation
      controls.start('firework');
      
      // Get container and create confetti
      const container = document.querySelector(`button[data-tab-id="${tabId}"]`);
      if (container) {
        setConfetti(createConfetti(container));
        
        // Clear confetti after animation
        setTimeout(() => {
          setConfetti([]);
        }, 2000);
      }
    } else if (tabId === 'adminlogin') {
      // Start crown animation
      await controls.start('crown');
      controls.set({ y: 0, scale: 1, rotate: 0, filter: 'none' });
      
      // Create sparkles with golden color
      const container = document.querySelector(`button[data-tab-id="${tabId}"]`);
      if (container) {
        setSparkles(createSparkles(container).map(sparkle => ({
          ...sparkle,
          color: '#FFD700', // Gold color for admin sparkles
          scale: sparkle.scale * 1.2 // Slightly larger sparkles
        })));
        
        // Clear sparkles after animation
        setTimeout(() => {
          setSparkles([]);
        }, 1000);
      }
    } else if (tabId === 'admin/attendance') {
      // Add a pulse animation for the attendance icon
      await controls.start('pulse');
    } else if (tabId === 'attendance') {
      // Add a pulse animation for the attendance icon
      await controls.start('pulse');
    }
  };

  return (
    <nav className='glass-tab-bar w-full'>
      <div className="logo-container relative">
        <div 
          className="logo-icon cursor-pointer"
          onClick={handleLogoClick}
        >
          💰
        </div>
        <div className="logo-text">PayRoll</div>
        
        {/* Add cash rain animation */}
        <AnimatePresence>
          {cashParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
                opacity: 0
              }}
              animate={{
                x: [0, particle.x, particle.x + (Math.random() * 50 - 25)], // Add some drift
                y: [0, -20, 200], // Higher rise before fall
                scale: [0, particle.scale, particle.scale * 0.8],
                rotate: [0, particle.rotation, particle.rotation * 1.5],
                opacity: [0, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.32, 0, 0.67, 0],
                times: [0, 0.2, 1]
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                pointerEvents: 'none',
                fontSize: '1.5rem', // Larger emoji
                filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.3))' // Add glow effect
              }}
            >
              {Math.random() > 0.5 ? '💵' : '💸'} {/* Randomly alternate between bill types */}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="tabs-container">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                handleTabClick(tab.id);
                handleIconClick(tab.id);
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <motion.span 
                className="tab-icon"
                initial={false}
                animate={activeTab === tab.id ? 'active' : 'inactive'}
                variants={getIconAnimation(tab.id)}
              >
                {tab.icon}
              </motion.span>
              <span className="tab-label">{tab.label}</span>
              <div className="tab-highlight" />
              
              {/* Add AnimatePresence for sparkles */}
              <AnimatePresence>
                {tab.id === 'register' && sparkles.map((sparkle: any) => (
                  <motion.div
                    key={sparkle.id}
                    className="sparkle-particle"
                    initial={{
                      x: sparkle.x,
                      y: sparkle.y,
                      scale: 0,
                      rotate: sparkle.rotation,
                      opacity: 0
                    }}
                    animate={{
                      scale: [0, sparkle.scale, 0],
                      opacity: [0, 1, 0],
                      rotate: sparkle.rotation + 90
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                      times: [0, 0.5, 1]
                    }}
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                      content: '"✨"',
                      fontSize: '8px'
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Add AnimatePresence for confetti */}
              <AnimatePresence>
                {tab.id === 'admin/leaves' && confetti.map((particle: any) => (
                  <motion.div
                    key={particle.id}
                    className="confetti-particle"
                    initial={{
                      x: particle.x,
                      y: particle.y,
                      rotate: particle.rotation,
                      scale: particle.scale,
                      opacity: 1
                    }}
                    animate={{
                      y: particle.y + 200,
                      x: particle.x + (Math.random() - 0.5) * 100,
                      rotate: particle.rotation + 360,
                      opacity: 0
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                      delay: Math.random() * 0.2
                    }}
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: particle.color,
                      pointerEvents: 'none'
                    }}
                  />
                ))}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {(activeTab.startsWith('admin/') || ['home', 'settings', 'attendance', 'leaves'].includes(activeTab)) && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 
              transition-colors text-sm font-medium"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default GlassTabBar; 