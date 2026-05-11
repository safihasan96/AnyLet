import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function PropertyLoader() {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
                transition={{ 
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                }}
                className="bg-primary/10 p-4 rounded-[1.25rem] relative"
            >
                <Home size={36} className="text-primary" strokeWidth={1.5} />
                <motion.div 
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-[1.25rem] border-2 border-primary"
                />
            </motion.div>
        </div>
    );
}
