import React, { useState, useEffect } from 'react';
import type { Prompt, PromptVersion, TestResult } from '../types';
import { XIcon, SparklesIcon } from './icons';

interface PromptComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

const VersionColumn: React.FC<{
    versions: PromptVersion[];
    selectedVersionNumber: number;
    onVersionChange: (versionNumber: number) => void;
    title: string;
}> = ({ versions, selectedVersionNumber, onVersionChange, title }) => {
    
    const selectedVersion = versions.find(v => v.version === selectedVersionNumber);

    return (
        <div className="flex-1 p-4 border-gray-200 dark:border-gray-700 flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
                 <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{title}</h3>
                 <select 
                    value={selectedVersionNumber}
                    onChange={(e) => onVersionChange(parseInt(e.target.value, 10))}
                    className="p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                 >
                    {versions.map(v => (
                        <option key={v.version} value={v.version}>
                            Version {v.version}
                        </option>
                    ))}
                 </select>
            </div>
            {selectedVersion && (
                <div className="flex flex-col space-y-4 flex-grow overflow-y-auto pr-2">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prompt Text</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md font-mono">{selectedVersion.promptText}</p>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Test Results</h4>
                        {selectedVersion.testResults && selectedVersion.testResults.length > 0 ? (
                             <ul className="space-y-4">
                                {selectedVersion.testResults.map(result => (
                                    <li key={result.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            {new Date(result.createdAt).toLocaleString()}
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">{result.output}</p>
                                        {result.evaluation && (
                                            <div className="mt-3 pt-3 border-t dark:border-gray-600 flex items-center space-x-2">
                                                <SparklesIcon className="w-4 h-4 text-primary-500" />
                                                <span className="font-bold text-primary-600 dark:text-primary-300">{result.evaluation.score}/10</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 italic"> - "{result.evaluation.feedback}"</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-gray-500 py-4">No test results for this version.</p>
                        )}
                     </div>
                </div>
            )}
        </div>
    );
};


export const PromptComparisonView: React.FC<PromptComparisonViewProps> = ({ isOpen, onClose, prompt }) => {
    const [versionA, setVersionA] = useState<number>(0);
    const [versionB, setVersionB] = useState<number>(0);

    const sortedVersions = prompt ? [...prompt.versions].sort((a, b) => b.version - a.version) : [];

    useEffect(() => {
        if (prompt && sortedVersions.length > 0) {
            setVersionA(prompt.currentVersion);
            // Set version B to the second most recent, or the same if only one exists
            const secondVersion = sortedVersions.find(v => v.version !== prompt.currentVersion) || sortedVersions[0];
            setVersionB(secondVersion.version);
        }
    }, [prompt, isOpen]);


    if (!isOpen || !prompt) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-60 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Compare Prompt Versions</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow flex divide-x dark:divide-gray-700 overflow-hidden">
                    <VersionColumn 
                        versions={sortedVersions}
                        selectedVersionNumber={versionA}
                        onVersionChange={setVersionA}
                        title="Version A"
                    />
                    <VersionColumn 
                        versions={sortedVersions}
                        selectedVersionNumber={versionB}
                        onVersionChange={setVersionB}
                        title="Version B"
                    />
                </div>
            </div>
        </div>
    );
};
