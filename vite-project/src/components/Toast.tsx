import React from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white 
      px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-3"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M5 13l4 4L19 7" />
    </svg>
    <span>{message}</span>
    <button
      onClick={onClose}
      className="ml-4 hover:text-white/80 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </motion.div>
); 