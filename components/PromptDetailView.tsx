import React, { useState, useMemo, useEffect } from 'react';
import type { Prompt, PromptVersion, TestResult } from '../types';
import { Modality } from '../types';
import { 
    XIcon, CopyIcon, EditIcon, DeleteIcon, ShareIcon,
    TextIcon, ImageIcon, VideoIcon, AudioIcon, CodeIcon, BeakerIcon, SparklesIcon,
    ArrowsRightLeftIcon, TemplateIcon
} from './icons';
import { PromptComparisonView } from './PromptComparisonView';

const getActiveVersion = (prompt: Prompt | null): PromptVersion | null => {
    if (!prompt || !prompt.versions || prompt.versions.length === 0) return null;
    return prompt.versions.find(v => v.version === prompt.currentVersion) || null;
};

const modalityIcons: Record<Modality, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [Modality.TEXT]: TextIcon,
    [Modality.IMAGE]: ImageIcon,
    [Modality.VIDEO]: VideoIcon,
    [Modality.AUDIO]: AudioIcon,
    [Modality.CODE]: CodeIcon,
};

const VARIABLE_REGEX = /\[([^\]]+)\]/g;

const TestResultItem: React.FC<{
    result: TestResult,
    prompt: Prompt,
    onEvaluateTest: (promptId: string, testResultId: string) => Promise<void>;
}> = ({ result, prompt, onEvaluateTest }) => {
    const [isEvaluating, setIsEvaluating] = useState(false);

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        await onEvaluateTest(prompt.id, result.id);
        setIsEvaluating(false);
    }

    return (
        <li className="p-4 space-y-3">
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Test run on: {new Date(result.createdAt).toLocaleString()}
                </p>
                { prompt.modality !== Modality.IMAGE && prompt.modality !== Modality.VIDEO && !result.evaluation &&
                    <button
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="flex items-center px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                    >
                        <SparklesIcon className="w-4 h-4 mr-1.5"/>
                        {isEvaluating ? 'Evaluating...' : 'Evaluate with AI'}
                    </button>
                }
            </div>
            {prompt.modality === Modality.IMAGE ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-center">
                    <img src={result.output} alt="Generated art for prompt" className="rounded-md max-w-full h-auto max-h-96" />
                </div>
            ) : prompt.modality === Modality.VIDEO ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-center">
                    <video controls src={result.output} className="rounded-md max-w-full h-auto max-h-96" />
                </div>
            ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">{result.output}</p>
            )}
            { result.evaluation &&
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800/50">
                    <div className="flex items-center space-x-3 mb-1">
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
        </li>
    );
};

const DetailTabContent: React.FC<{
    prompt: Prompt;
    sortedVersions: PromptVersion[];
    onChangeVersion: (promptId: string, version: number) => void;
}> = ({ prompt, sortedVersions, onChangeVersion }) => {
    const activePromptText = getActiveVersion(prompt)?.promptText || '';
    return (
        <div className="space-y-6">
            <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prompt (Version {prompt.currentVersion})</h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">{activePromptText}</p>
            </div>
            </div>
            
            {prompt.notes && (
                <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">{prompt.notes}</p>
                </div>
            )}

            {sortedVersions.length > 1 && (
                <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Version History</h3>
                <div className="border dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                    <ul className="divide-y dark:divide-gray-700">
                    {sortedVersions.map((v) => (
                        <li key={v.version} className={`p-3 flex justify-between items-center ${v.version === prompt.currentVersion ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                        <div>
                            <span className="font-semibold">Version {v.version}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">{new Date(v.createdAt).toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => onChangeVersion(prompt.id, v.version)}
                            disabled={v.version === prompt.currentVersion}
                            className="px-3 py-1 text-xs font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-gray-100 enabled:dark:hover:bg-gray-600 border dark:border-gray-600"
                        >
                            {v.version === prompt.currentVersion ? 'Active' : 'Set as Active'}
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
                </div>
            )}

            <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Details</h3>
                <div className="flex flex-wrap gap-4">
                {prompt.theme && (
                    <div>
                        <span className="text-xs font-semibold text-gray-500">Theme:</span>
                        <span className="ml-2 inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-primary-900 dark:text-primary-300">{prompt.theme}</span>
                    </div>
                )}
                    <div>
                    <span className="text-xs font-semibold text-gray-500">Created:</span>
                    <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                </div>
                </div>
            </div>
            
            <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
                {prompt.tags.map(tag => tag && <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
            </div>
            </div>
        </div>
    );
};

const TestingTabContent: React.FC<{
    prompt: Prompt;
    isTesting: boolean;
    handleRunTest: () => Promise<void>;
    setIsCompareModalOpen: (isOpen: boolean) => void;
    onEvaluateTest: (promptId: string, testResultId: string) => Promise<void>;
    templateVariables: string[];
    variableValues: Record<string, string>;
    handleVariableChange: (varName: string, value: string) => void;
    compiledPrompt: string;
    allVariablesFilled: boolean;
}> = ({ prompt, isTesting, handleRunTest, setIsCompareModalOpen, onEvaluateTest, templateVariables, variableValues, handleVariableChange, compiledPrompt, allVariablesFilled }) => {
    const activeVersion = getActiveVersion(prompt);
    const activePromptText = activeVersion?.promptText || '';
    return (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Test Active Version ({`v${prompt.currentVersion}`})</h3>
                    {prompt.versions.length > 1 && (
                         <button
                            onClick={() => setIsCompareModalOpen(true)}
                            className="flex items-center px-3 py-1 text-xs font-medium text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900"
                        >
                            <ArrowsRightLeftIcon className="w-4 h-4 mr-1.5"/>
                            Compare Versions
                        </button>
                    )}
                </div>
                
                {templateVariables.length > 0 && (
                    <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                            <TemplateIcon className="w-5 h-5"/>
                            <h4 className="font-semibold">Prompt Template</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templateVariables.map(varName => (
                                <div key={varName}>
                                    <label htmlFor={varName} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{varName.replace(/_/g, ' ')}</label>
                                    <input
                                        type="text"
                                        id={varName}
                                        value={variableValues[varName] || ''}
                                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                                        className="mt-1 block w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
                                    />
                                </div>
                            ))}
                        </div>
                        <div>
                            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Live Preview</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700 whitespace-pre-wrap">{compiledPrompt}</p>
                        </div>
                    </div>
                )}
                
                {templateVariables.length === 0 && (
                     <p className="text-xs text-gray-600 dark:text-gray-400 font-mono p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700 whitespace-pre-wrap">{activePromptText}</p>
                )}

                <button
                    onClick={handleRunTest}
                    disabled={isTesting || (templateVariables.length > 0 && !allVariablesFilled)}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <BeakerIcon className="w-5 h-5 mr-2"/>
                    {isTesting 
                        ? (prompt.modality === Modality.IMAGE ? 'Generating...' : prompt.modality === Modality.VIDEO ? 'Generating video...' : 'Running...')
                        : (prompt.modality === Modality.IMAGE ? 'Generate Image' : prompt.modality === Modality.VIDEO ? 'Generate Video' : 'Run Test')
                    }
                </button>
            </div>

             <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Test History for v{prompt.currentVersion}</h3>
                <div className="border dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto">
                    {isTesting && (
                        <div className="p-6 text-center text-sm text-gray-500 animate-pulse border-b dark:border-gray-700">
                            {prompt.modality === Modality.IMAGE ? 'Generating image, this may take a moment...' : prompt.modality === Modality.VIDEO ? 'Generating video, this can take a few minutes...' : 'Running test...'}
                        </div>
                    )}
                    {activeVersion?.testResults && activeVersion.testResults.length > 0 ? (
                         <ul className="divide-y dark:divide-gray-700">
                            {activeVersion.testResults.map(result => (
                               <TestResultItem key={result.id} result={result} prompt={prompt} onEvaluateTest={onEvaluateTest} />
                            ))}
                        </ul>
                    ) : (
                        !isTesting && (
                            <div className="p-10 text-center text-sm text-gray-500">
                                No tests have been run for this version yet.
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export const PromptDetailView: React.FC<{
  prompt: Prompt | null;
  onClose: () => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onChangeVersion: (promptId: string, version: number) => void;
  onRunTest: (promptId: string, compiledPromptText?: string) => Promise<void>;
  onEvaluateTest: (promptId: string, testResultId: string) => Promise<void>;
  onShare: (prompt: Prompt) => void;
  onEnhance: (prompt: Prompt) => void;
}> = ({ prompt, onClose, onEdit, onDelete, onCopy, onChangeVersion, onRunTest, onEvaluateTest, onShare, onEnhance }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'testing'>('details');
  const [isTesting, setIsTesting] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const activePromptText = useMemo(() => getActiveVersion(prompt)?.promptText || '', [prompt]);
  
  const templateVariables = useMemo(() => {
    const matches = activePromptText.matchAll(VARIABLE_REGEX);
    const uniqueVars = new Set<string>();
    for (const match of matches) {
      uniqueVars.add(match[1]);
    }
    return Array.from(uniqueVars);
  }, [activePromptText]);
  
  const compiledPrompt = useMemo(() => {
    if (templateVariables.length === 0) return activePromptText;
    return activePromptText.replace(VARIABLE_REGEX, (match, varName) => {
        return variableValues[varName] || `[${varName}]`;
    });
  }, [activePromptText, templateVariables, variableValues]);
  
  const allVariablesFilled = useMemo(() => {
      return templateVariables.every(v => variableValues[v] && variableValues[v].trim() !== '');
  }, [templateVariables, variableValues]);

  useEffect(() => {
    if (prompt) {
        setVariableValues({});
        setActiveTab('details');
    }
  }, [prompt]);
  
  const handleRunTest = async () => {
    if (!prompt) return;
    setIsTesting(true);
    const textToRun = templateVariables.length > 0 ? compiledPrompt : activePromptText;
    await onRunTest(prompt.id, textToRun);
    setIsTesting(false);
  };
  
  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [varName]: value }));
  };
  
  if (!prompt) return null;

  const ModalityIcon = modalityIcons[prompt.modality];
  const sortedVersions = [...prompt.versions].sort((a, b) => b.version - a.version);

  return (
    <>
    <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm ${prompt ? 'visible' : 'invisible'}`} onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <ModalityIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{prompt.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b dark:border-gray-700 px-6">
            <nav className="-mb-px flex space-x-6">
                 <button
                    onClick={() => setActiveTab('details')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Details
                </button>
                 <button
                    onClick={() => setActiveTab('testing')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'testing' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Testing
                </button>
            </nav>
        </div>


        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {activeTab === 'details' ? (
              <DetailTabContent prompt={prompt} sortedVersions={sortedVersions} onChangeVersion={onChangeVersion} />
          ) : (
              <TestingTabContent 
                prompt={prompt} 
                isTesting={isTesting}
                handleRunTest={handleRunTest}
                setIsCompareModalOpen={setIsCompareModalOpen}
                onEvaluateTest={onEvaluateTest}
                templateVariables={templateVariables}
                variableValues={variableValues}
                handleVariableChange={handleVariableChange}
                compiledPrompt={compiledPrompt}
                allVariablesFilled={allVariablesFilled}
              />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
           <div>
               <button onClick={() => onEnhance(prompt)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                 <SparklesIcon className="w-5 h-5 text-primary-500"/>
                 <span>Enhance with AI</span>
              </button>
           </div>
           <div className="flex items-center space-x-3">
               <button onClick={() => onShare(prompt)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                 <ShareIcon className="w-5 h-5"/>
                 <span>Share</span>
              </button>
              <button onClick={() => onCopy(activePromptText)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                 <CopyIcon className="w-5 h-5"/>
                 <span>Copy Prompt</span>
              </button>
              <button onClick={() => onEdit(prompt)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                <EditIcon className="w-5 h-5"/>
                <span>Edit</span>
              </button>
               <button onClick={() => onDelete(prompt.id)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700">
                <DeleteIcon className="w-5 h-5"/>
                <span>Delete</span>
              </button>
           </div>
        </div>
      </div>
    </div>
    
    <PromptComparisonView 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        prompt={prompt}
    />
    </>
  );
};
