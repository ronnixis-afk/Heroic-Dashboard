import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const MODELS = [
  { id: 'gemini', label: 'Gemini 3.1 Flash Lite', icon: Sparkles, color: 'text-brand-accent' },
  { id: 'deepseek', label: 'Deepseek V4 Flash', icon: Brain, color: 'text-orange-400' },
];

interface ModelSelectorProps {
  isCollapsed: boolean;
}

export default function ModelSelector({ isCollapsed }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('heroic_global_model');
    if (saved && MODELS.find(m => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  const handleSelect = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem('heroic_global_model', id);
    setIsOpen(false);
    
    // Trigger a custom event for any listeners
    window.dispatchEvent(new CustomEvent('heroic_model_changed', { detail: { model: id } }));
  };

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="relative px-2 mb-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute bottom-full mb-3 overflow-hidden rounded-2xl border border-[#292a32] bg-[#1d1e24] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50",
              isCollapsed ? "left-0 w-48" : "left-2 right-2"
            )}
          >
            <div className="p-1.5 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                Select Engine
              </div>
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    selectedModel === model.id 
                      ? "bg-[#292a32] text-white shadow-inner" 
                      : "text-[#8b8c94] hover:bg-[#1a1b21] hover:text-white"
                  )}
                >
                  <model.icon size={16} className={cn(model.color, "transition-transform group-hover:scale-110")} />
                  <span className="font-medium">{model.label}</span>
                  {selectedModel === model.id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-[1.5rem] px-4 py-3 transition-all duration-300 border border-[#292a32]/50 hover:border-brand-accent/30",
          isOpen ? "bg-[#292a32] border-brand-accent/50 shadow-lg ring-1 ring-brand-accent/20" : "bg-[#111114] hover:bg-[#1a1b21]"
        )}
      >
        <div className={cn(
          "p-1 rounded-lg bg-[#1d1e24] transition-colors",
          isOpen ? "bg-brand-accent/10" : "group-hover:bg-[#292a32]"
        )}>
          <currentModel.icon size={18} className={cn(currentModel.color, "shrink-0")} />
        </div>
        
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 items-center justify-between overflow-hidden"
          >
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase leading-none mb-0.5">Model</span>
              <span className="text-sm font-semibold truncate leading-none">{currentModel.label.split(' ')[0]}</span>
            </div>
            <ChevronUp size={14} className={cn("text-[#8b8c94] transition-transform duration-300", isOpen ? "rotate-0" : "rotate-180")} />
          </motion.div>
        )}
      </button>
    </div>
  );
}
