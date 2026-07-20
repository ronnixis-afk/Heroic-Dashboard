import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../../hooks/useAnalytics';

interface ModelOption {
  name: string;
  blendedRate: number; // per 1M tokens
  /** Credit weight vs Gemini 3.1 Flash Lite (1 credit ≈ 1,000 tokens). */
  creditMultiplier?: number;
}

const MODELS: ModelOption[] = [
  { name: 'Gemini 3.1 Flash Lite', blendedRate: 0.875, creditMultiplier: 1 },
  { name: 'DeepSeek V4 Flash', blendedRate: 0.21, creditMultiplier: 0.24 },
  { name: 'DeepSeek V4 Pro', blendedRate: 0.6525, creditMultiplier: 0.75 },
  { name: 'Gemini 3.5 Flash', blendedRate: 5.25 },
  { name: 'Gemini 3 Flash', blendedRate: 1.75 },
  { name: 'Gemini 3.1 / 3.5 Pro', blendedRate: 7.00 },
  { name: 'Gemini 1.5 / 2.5 Pro', blendedRate: 3.125 },
  { name: 'Gemini 1.5 / 2.0 / 2.5 Flash', blendedRate: 0.1875 },
  { name: 'Gemini 1.5 Flash 8b', blendedRate: 0.09375 }
];

export default function TokenEstimator() {
  const [tokensProcessed, setTokensProcessed] = useState('2,500,000');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [estimatedCost, setEstimatedCost] = useState('2.19');
  const [showInputDropdown, setShowInputDropdown] = useState(false);
  const [showUsdDropdown, setShowUsdDropdown] = useState(false);
  const [inputType, setInputType] = useState('Tokens');
  const [currencyType, setCurrencyType] = useState('USD');
  const { trackEvent } = useAnalytics();

  const calculateCost = (value: string, modelObj = selectedModel, type: string = currencyType) => {
    const tokens = parseInt(value.replace(/,/g, '')) || 0;
    
    if (type === 'Credits') {
      const multiplier = modelObj.creditMultiplier ?? 1;
      const credits = Math.max(1, Math.ceil((tokens / 1000) * multiplier));
      setEstimatedCost(credits.toString());
    } else if (type === 'EUR') {
      const costUsd = (tokens / 1000000) * modelObj.blendedRate;
      const costEur = costUsd * 0.92;
      setEstimatedCost(costEur.toFixed(2));
    } else {
      const cost = (tokens / 1000000) * modelObj.blendedRate;
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
    calculateCost(tokensProcessed, selectedModel, type);
    trackEvent('estimator_currency_type_changed', { type });
  };

  const handleModelChange = (modelName: string) => {
    const newModel = MODELS.find(m => m.name === modelName) || MODELS[0];
    setSelectedModel(newModel);
    calculateCost(tokensProcessed, newModel, currencyType);
    trackEvent('estimator_model_changed', { model: modelName });
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
                type="button"
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
                        type="button"
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
          <div className="mt-1">
            <select
              value={selectedModel.name}
              onChange={(e) => handleModelChange(e.target.value)}
              className="bg-transparent text-xs text-brand-text-muted outline-none cursor-pointer hover:text-white transition-colors border-none p-0"
            >
              {MODELS.map(m => (
                <option key={m.name} value={m.name} className="bg-brand-bg text-brand-text">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
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
                type="button"
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
                        type="button"
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
          <p className="text-xs text-brand-text-muted mt-1">
            ~${selectedModel.blendedRate.toFixed(2)} / 1M Tokens (Blended)
          </p>
        </div>
      </div>
    </div>
  );
}

