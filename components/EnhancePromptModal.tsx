import React, { useState, useCallback } from 'react';
import type { Prompt } from '../types';
import { enhancePrompt } from '../services/geminiService';
import { XIcon, SparklesIcon } from './icons';

interface EnhancePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onApply: (newPromptText: string) => void;
}

const getActivePromptText = (prompt: Prompt | null): string => {
    if (!prompt) return '';
    const activeVersion = prompt.versions.find(v => v.version === prompt.currentVersion);
    return activeVersion ? activeVersion.promptText : '';
};

export const EnhancePromptModal: React.FC<EnhancePromptModalProps> = ({ isOpen, onClose, prompt, onApply }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

    const originalPromptText = getActivePromptText(prompt);

    const handleGetSuggestions = useCallback(async (type: 'improve' | 'variations') => {
        setIsLoading(true);
        setError('');
        setSuggestions([]);
        setSelectedSuggestion(null);
        try {
            const result = await enhancePrompt(originalPromptText, type);
            setSuggestions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [originalPromptText]);

    const handleApplyClick = () => {
        if (selectedSuggestion) {
            onApply(selectedSuggestion);
            onClose();
        }
    };
    
    // Reset state when modal is closed or prompt changes
    React.useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
            setSuggestions([]);
            setError('');
            setSelectedSuggestion(null);
        }
    }, [isOpen]);

    if (!isOpen || !prompt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-60 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-primary-500"/>
            Enhance Prompt with AI
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Original Prompt (v{prompt.currentVersion})</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md font-mono">{originalPromptText}</p>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
                <button
                    onClick={() => handleGetSuggestions('improve')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                >
                    Improve Clarity & Detail
                </button>
                 <button
                    onClick={() => handleGetSuggestions('variations')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                    Suggest Variations
                </button>
            </div>

            <div className="min-h-[200px]">
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500 animate-pulse">Generating suggestions...</p>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {suggestions.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Suggestions</h3>
                        <div className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedSuggestion(suggestion)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedSuggestion === suggestion ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'}`}
                                >
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
           <button
             onClick={handleApplyClick}
             disabled={!selectedSuggestion}
             className="ml-3 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
           >
            Apply as New Version
           </button>
        </div>
      </div>
    </div>
  );
};