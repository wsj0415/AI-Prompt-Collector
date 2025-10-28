import React from 'react';
import type { Prompt, TestResult } from '../types';
import { 
    TextIcon, ImageIcon, VideoIcon, AudioIcon, CodeIcon
} from './icons';
import { Modality } from '../types';

interface SharedPromptViewProps {
  prompt: Prompt;
}

const modalityIcons: Record<Modality, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [Modality.TEXT]: TextIcon,
    [Modality.IMAGE]: ImageIcon,
    [Modality.VIDEO]: VideoIcon,
    [Modality.AUDIO]: AudioIcon,
    [Modality.CODE]: CodeIcon,
};

const findBestTestResult = (prompt: Prompt): TestResult | null => {
    let bestResult: TestResult | null = null;
    let highestScore = -1;

    for (const version of prompt.versions) {
        if (version.testResults) {
            for (const result of version.testResults) {
                if (result.evaluation && result.evaluation.score > highestScore) {
                    highestScore = result.evaluation.score;
                    bestResult = result;
                }
            }
        }
    }
    return bestResult;
};

const BestTestResultDisplay: React.FC<{ result: TestResult, modality: Modality }> = ({ result, modality }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Best Test Result</h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
            {modality === Modality.IMAGE ? (
                <div className="flex justify-center">
                    <img src={result.output} alt="Generated art for prompt" className="rounded-md max-w-full h-auto max-h-96" />
                </div>
            ) : modality === Modality.VIDEO ? (
                <div className="flex justify-center">
                    <video controls src={result.output} className="rounded-md max-w-full h-auto max-h-96" />
                </div>
            ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{result.output}</p>
            )}
            { result.evaluation &&
                <div className="pt-3 border-t dark:border-gray-600">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-500 text-white font-bold text-lg rounded-full">
                           {result.evaluation.score}
                        </div>
                        <div>
                             <h4 className="font-semibold text-primary-800 dark:text-primary-200">AI Evaluation</h4>
                             <p className="text-sm text-primary-700 dark:text-primary-300 italic">"{result.evaluation.feedback}"</p>
                        </div>
                    </div>
                </div>
            }
        </div>
    </div>
);

const SharedPromptView: React.FC<SharedPromptViewProps> = ({ prompt }) => {
    const activeVersion = prompt.versions.find(v => v.version === prompt.currentVersion);
    const bestTestResult = findBestTestResult(prompt);
    const ModalityIcon = modalityIcons[prompt.modality];

    if (!activeVersion) {
        return <div className="text-center p-8">Error: Could not find active version of the shared prompt.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <header className="p-5 border-b dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Shared via</p>
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">AI Prompt Collector</h1>
                </header>

                {/* Content */}
                <main className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex-1 pr-4">{prompt.title}</h2>
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                            <ModalityIcon className="w-5 h-5" />
                            <span className="font-medium text-sm">{prompt.modality}</span>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prompt Text (v{prompt.currentVersion})</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">{activeVersion.promptText}</p>
                        </div>
                    </div>

                    {prompt.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">{prompt.notes}</p>
                        </div>
                    )}
                    
                    {bestTestResult && <BestTestResultDisplay result={bestTestResult} modality={prompt.modality} />}

                    <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
                        {prompt.theme && (
                            <div className="flex items-center">
                                <span className="text-xs font-semibold text-gray-500 mr-2">Theme:</span>
                                <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-primary-900 dark:text-primary-300">{prompt.theme}</span>
                            </div>
                        )}
                        {prompt.tags.length > 0 && (
                             <div className="flex items-center flex-wrap gap-2">
                                <span className="text-xs font-semibold text-gray-500">Tags:</span>
                                {prompt.tags.map(tag => tag && <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 text-center">
                    <a href={window.location.origin + window.location.pathname} className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700">
                        Return to My Collection
                    </a>
                </footer>
            </div>
        </div>
    );
};

export default SharedPromptView;
