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
  const currentModelName = 'Gemini 3.1 Flash Lite';

  const calculateCost = (value: string, type: string = currencyType) => {
    const tokens = parseInt(value.replace(/,/g, '')) || 0;
    
    if (type === 'Credits') {
      const credits = Math.max(1, Math.ceil(tokens / 1000));
      setEstimatedCost(credits.toString());
    } else if (type === 'EUR') {
      const costUsd = (tokens / 1000000) * 0.60;
      const costEur = costUsd * 0.92;
      setEstimatedCost(costEur.toFixed(2));
    } else {
      const cost = (tokens / 1000000) * 0.60;
      setEstimatedCost(cost.toFixed(2));
    }
  };

  const handleInputTypeChange = (type: string) => {
    setInputType(type);
    setShowInputDropdown(false);
    trackEvent('estimator_input_type_changed', { type });
  };

  const handleCurrencyTypeChange = (type: string) => {
    setCurrencyType(type);
    setShowUsdDropdown(false);
    calculateCost(tokensProcessed, type);
    trackEvent('estimator_currency_type_changed', { type });
  };

  return (
    <div className="card col-span-1 p-3.5 relative h-[300px] flex flex-col">
      <h3 className="text-header font-semibold mb-3">Token Estimator</h3>
      
      <div className="flex-1 flex flex-col justify-between gap-2">
        <div className="bg-brand-bg rounded-lg border border-brand-primary p-3 relative">
          <label className="input-label mb-0">Tokens Processed</label>
          <div className="flex justify-between items-center mt-1 gap-2">
            <input 
              type="text" 
              value={tokensProcessed}
              onChange={(e) => {
                setTokensProcessed(e.target.value);
                calculateCost(e.target.value);
              }}
              onBlur={() => trackEvent('token_cost_estimated', { tokens: tokensProcessed, cost: estimatedCost })}
              className="bg-transparent card-metric flex-1 min-w-0 outline-none" 
            />
            <div className="relative">
              <button 
                onClick={() => setShowInputDropdown(!showInputDropdown)}
                className="btn-secondary btn-sm shrink-0"
              >
                {inputType} <ChevronDown size={12} className="text-brand-text-muted"/>
              </button>
              
              <AnimatePresence>
                {showInputDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="tooltip-panel absolute right-0 top-full mt-1 w-28 !p-0 overflow-hidden z-10"
                  >
                    {['Tokens', 'Words', 'Chars'].map(type => (
                      <button 
                        key={type}
                        onClick={() => handleInputTypeChange(type)}
                        className="w-full text-left px-3 py-1.5 text-xs text-brand-text-muted hover:bg-brand-hover hover:text-white transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-xs text-brand-text-muted mt-1">{currentModelName}</p>
        </div>

        <div className="bg-brand-bg rounded-lg border border-brand-primary p-3">
          <label className="input-label mb-0">Estimated Cost</label>
          <div className="flex justify-between items-center mt-1 gap-2">
            <input 
              type="text" 
              value={estimatedCost} 
              className="bg-transparent card-metric flex-1 min-w-0 outline-none" 
              readOnly
            />
            <div className="relative">
              <button 
                onClick={() => setShowUsdDropdown(!showUsdDropdown)}
                className="btn-secondary btn-sm shrink-0"
              >
                {currencyType} <ChevronDown size={12} className="text-brand-text-muted"/>
              </button>
              
              <AnimatePresence>
                {showUsdDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="tooltip-panel absolute right-0 top-full mt-1 w-28 !p-0 overflow-hidden z-10"
                  >
                    {['USD', 'EUR', 'Credits'].map(type => (
                      <button 
                        key={type}
                        onClick={() => handleCurrencyTypeChange(type)}
                        className="w-full text-left px-3 py-1.5 text-xs text-brand-text-muted hover:bg-brand-hover hover:text-white transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-xs text-brand-text-muted mt-1">~$0.60 / 1M Tokens (Blended)</p>
        </div>
      </div>
    </div>
  );
}
