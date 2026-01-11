import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full mb-10 group",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[80%] items-end gap-5",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        {isAssistant && (
          <div className="flex-shrink-0 mb-1">
            <div className="relative">
              <div className="absolute inset-0 bg-vibrant-blue/20 blur-md rounded-full animate-pulse-slow" />
              <Avatar className="h-10 w-10 border-2 border-white shadow-xl relative">
                <AvatarImage src="/ai-avatar.png" alt="AI" />
                <AvatarFallback className="premium-gradient text-[10px] font-black text-white">SB</AvatarFallback>
              </Avatar>
            </div>
          </div>
        )}
        
        <div className={cn(
          "relative px-7 py-5 rounded-[2.2rem] text-[15px] leading-relaxed transition-all",
          isAssistant 
            ? "glass-card-vibrant border-white text-slate-700 rounded-bl-none shadow-xl hover:shadow-2xl" 
            : "accent-gradient text-white rounded-br-none shadow-2xl shadow-vibrant-coral/20 hover:shadow-vibrant-coral/40 font-bold"
        )}>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-[2.2rem] pointer-events-none opacity-10">
            <div className={cn(
                "absolute -top-1/2 -left-1/2 w-full h-full bg-white blur-3xl transition-transform duration-1000 group-hover:translate-x-1/2 group-hover:translate-y-1/2",
                !isAssistant && "hidden"
            )} />
          </div>

          <p className="whitespace-pre-wrap relative z-10">
            {message.content}
          </p>
          
          <div className={cn(
            "absolute -bottom-6 text-[9px] font-black opacity-0 group-hover:opacity-60 transition-all uppercase tracking-[0.2em]",
            isAssistant ? "left-2 text-slate-400" : "right-2 text-vibrant-coral"
          )}>
            {isAssistant ? 'Buddy' : 'Scholar'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
