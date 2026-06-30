import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    // Hide splash screen after animations finish
    const timer = setTimeout(() => {
      onComplete();
    }, 1800); // 1.8s — logo draws in ~1.5s, 0.3s buffer

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F1117] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.1,
        filter: "blur(20px)"
      }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }}
    >
      {/* Deep, dynamic ambient light */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-xl max-h-xl bg-indigo-900/30 rounded-full blur-[100px] pointer-events-none" 
      />

      <motion.div
        className="relative flex flex-col items-center justify-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="relative"
        >
          {/* Intense rotating backglow */}
          <motion.div 
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ 
                opacity: { delay: 1.5, duration: 1.5 },
                rotate: { duration: 12, repeat: Infinity, ease: "linear" } 
            }}
            className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-transparent blur-[30px] rounded-full scale-[1.2] z-0" 
          />
          
          {/* Logo Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex items-center justify-center w-40 h-40 md:w-56 md:h-56 rounded-[32px] md:rounded-[48px] bg-[#2a1658] shadow-[0_20px_80px_-15px_rgba(76,29,149,0.5)] border border-white/10 ring-1 ring-inset ring-white/5 overflow-hidden"
          >
            {/* SVG Logo with Stroke Animation */}
            <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                {/* Roof */}
                <motion.path 
                    d="M 15 55 L 50 20 L 85 55" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                />
                {/* Inner P / Pin */}
                <motion.path 
                    d="M 50 85 L 35 60 A 15 15 0 1 1 65 60 A 15 15 0 0 1 50 71" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
                />
            </svg>

            {/* Shimmer sweep effect like glass reflection */}
            <motion.div
              initial={{ x: '-200%' }}
              animate={{ x: '200%' }}
              transition={{ 
                  duration: 2.5, 
                  delay: 2.5,
                  ease: "easeInOut",
              }}
              className="absolute top-0 bottom-0 left-0 z-20 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] pointer-events-none"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
