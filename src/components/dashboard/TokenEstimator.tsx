import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function TokenEstimator() {
  const [tokensProcessed, setTokensProcessed] = useState('2,500,000');
  const [estimatedCost, setEstimatedCost] = useState('0.19');
  const [showInputDropdown, setShowInputDropdown] = useState(false);
  const [showUsdDropdown, setShowUsdDropdown] = useState(false);
  const [inputType, setInputType] = useState('Tokens');
  const [currencyType, setCurrencyType] = useState('USD');
  const { trackEvent } = useAnalytics();

  const calculateCost = (value: string) => {
    const tokens = parseInt(value.replace(/,/g, '')) || 0;
    const cost = (tokens / 1000000) * 0.075;
    setEstimatedCost(cost.toFixed(2));
    
    // Throttle tracking or track on blur, but for now we track on change if desired.
    // Or we could track when they select a different input type.
  };

  const handleInputTypeChange = (type: string) => {
    setInputType(type);
    setShowInputDropdown(false);
    trackEvent('estimator_input_type_changed', { type });
  };

  const handleCurrencyTypeChange = (type: string) => {
    setCurrencyType(type);
    setShowUsdDropdown(false);
    trackEvent('estimator_currency_type_changed', { type });
  };

  return (
    <div className="glass-panel col-span-1 p-6 relative h-[380px] flex flex-col">
      <h3 className="text-xl font-bold mb-6">Token Estimator</h3>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative">
          <label className="text-xs text-[#8b8c94] font-medium mb-1 block">Tokens Processed</label>
          <div className="flex justify-between items-center mt-2">
            <input 
              type="text" 
              value={tokensProcessed}
              onChange={(e) => {
                setTokensProcessed(e.target.value);
                calculateCost(e.target.value);
              }}
              onBlur={() => trackEvent('token_cost_estimated', { tokens: tokensProcessed, cost: estimatedCost })}
              className="bg-transparent text-3xl font-bold flex-1 min-w-0 mr-4 outline-none" 
            />
            <div className="relative">
              <button 
                onClick={() => setShowInputDropdown(!showInputDropdown)}
                className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                  <div className="w-2 h-2 bg-indigo-400 rounded-sm"></div>
                </span>
                {inputType} <ChevronDown size={14} className="text-[#8b8c94]"/>
              </button>
              
              <AnimatePresence>
                {showInputDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-[#1d1e24] border border-[#292a32] shadow-xl overflow-hidden z-10"
                  >
                    {['Tokens', 'Words', 'Chars'].map(type => (
                      <button 
                        key={type}
                        onClick={() => handleInputTypeChange(type)}
                        className="w-full text-left px-4 py-2 text-xs text-brand-text-muted hover:bg-[#292a32] hover:text-white transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-xs text-[#8b8c94] mt-2 font-medium">Gemini 3.1 Flash</p>
        </div>

        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 mt-4">
          <label className="text-xs text-[#8b8c94] font-medium mb-1 block">Estimated Cost</label>
          <div className="flex justify-between items-center mt-2">
            <input 
              type="text" 
              value={estimatedCost} 
              className="bg-transparent text-3xl font-bold flex-1 min-w-0 mr-4 outline-none" 
              readOnly
            />
            <div className="relative">
              <button 
                onClick={() => setShowUsdDropdown(!showUsdDropdown)}
                className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="text-[10px] font-bold text-emerald-400">{currencyType === 'USD' ? '$' : currencyType === 'EUR' ? '€' : 'C'}</div>
                </span>
                {currencyType} <ChevronDown size={14} className="text-[#8b8c94]"/>
              </button>
              
              <AnimatePresence>
                {showUsdDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-[#1d1e24] border border-[#292a32] shadow-xl overflow-hidden z-10"
                  >
                    {['USD', 'EUR', 'Credits'].map(type => (
                      <button 
                        key={type}
                        onClick={() => handleCurrencyTypeChange(type)}
                        className="w-full text-left px-4 py-2 text-xs text-brand-text-muted hover:bg-[#292a32] hover:text-white transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-xs text-[#8b8c94] mt-2 font-medium">~$0.075 / 1M tokens</p>
        </div>
      </div>
    </div>
  );
}
