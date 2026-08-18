import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-[#121320] z-[999999] overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col items-center relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                    transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="relative bg-white dark:bg-slate-800 shadow-2xl shadow-primary/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700"
                >
                    <Home size={64} className="text-primary dark:text-indigo-400" strokeWidth={1.5} />
                    
                    {/* Ring animation */}
                    <motion.div 
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        className="absolute inset-0 rounded-[2rem] border-2 border-primary"
                    />
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-3xl font-black text-slate-900 dark:text-white tracking-tight"
                >
                    Any-Let
                </motion.h1>
                
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase text-sm"
                >
                    Finding your perfect space...
                </motion.p>
                

            </div>
        </div>
    );
}
