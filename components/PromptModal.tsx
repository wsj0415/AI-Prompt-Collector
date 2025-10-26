
import React, { useState, useEffect, useCallback } from 'react';
import type { Prompt, PromptVersion } from '../types';
import { Modality } from '../types';
import { generateTagsAndTheme } from '../services/geminiService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  promptToEdit: Prompt | null;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, promptToEdit }) => {
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [modality, setModality] = useState<Modality>(Modality.TEXT);
  const [theme, setTheme] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [error, setError] = useState('');
  
  const getActivePromptText = (prompt: Prompt | null): string => {
    if (!prompt) return '';
    const activeVersion = prompt.versions.find(v => v.version === prompt.currentVersion);
    return activeVersion ? activeVersion.promptText : '';
  };

  useEffect(() => {
    if (promptToEdit) {
      setTitle(promptToEdit.title);
      setPromptText(getActivePromptText(promptToEdit));
      setModality(promptToEdit.modality);
      setTheme(promptToEdit.theme);
      setTags(promptToEdit.tags);
      setNotes(promptToEdit.notes || '');
    } else {
      // Reset form when opening for a new prompt
      setTitle('');
      setPromptText('');
      setModality(Modality.TEXT);
      setTheme('');
      setTags([]);
      setNotes('');
    }
    setError('');
  }, [promptToEdit, isOpen]);

  const handleAutoCategorize = useCallback(async () => {
    if (!promptText.trim()) {
      setError('Please enter a prompt before categorizing.');
      return;
    }
    setIsCategorizing(true);
    setError('');
    try {
      const result = await generateTagsAndTheme(promptText);
      setTheme(result.theme);
      setTags(result.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsCategorizing(false);
    }
  }, [promptText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
        setError('Title and Prompt Text are required.');
        return;
    }

    if (promptToEdit) { // Editing existing prompt
        const originalPromptText = getActivePromptText(promptToEdit);
        let newVersions = [...promptToEdit.versions];
        let newCurrentVersion = promptToEdit.currentVersion;

        // Create a new version only if the prompt text has actually changed
        if (originalPromptText !== promptText) {
            const newVersionNumber = Math.max(0, ...newVersions.map(v => v.version)) + 1;
            const newVersion: PromptVersion = {
                version: newVersionNumber,
                promptText: promptText,
                createdAt: new Date().toISOString()
            };
            newVersions.push(newVersion);
            newCurrentVersion = newVersionNumber;
        }

        const updatedPrompt: Prompt = {
            ...promptToEdit,
            title,
            modality,
            theme,
            tags,
            notes,
            versions: newVersions,
            currentVersion: newCurrentVersion,
        };
        onSave(updatedPrompt);

    } else { // Creating new prompt
         const newPrompt: Prompt = {
            id: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            title,
            modality,
            theme,
            tags,
            notes,
            versions: [{ version: 1, promptText, createdAt: new Date().toISOString() }],
            currentVersion: 1,
        };
        onSave(newPrompt);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{promptToEdit ? 'Edit Prompt' : 'Add New Prompt'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" required />
          </div>
          <div>
            <label htmlFor="promptText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt Text</label>
            <textarea id="promptText" value={promptText} onChange={e => setPromptText(e.target.value)} rows={6} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" required />
          </div>
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modality</label>
            <select id="modality" value={modality} onChange={e => setModality(e.target.value as Modality)} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2">
              {Object.values(Modality).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Categorization</h3>
                <button type="button" onClick={handleAutoCategorize} disabled={isCategorizing} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isCategorizing ? 'Analyzing...' : 'Generate with AI'}
                </button>
            </div>
             {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <input type="text" id="theme" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g., Creative Writing" className="mt-1 block w-full bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded-md shadow-sm sm:text-sm p-2" />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
              <input type="text" id="tags" value={tags.join(', ')} onChange={e => setTags(e.target.value.split(',').map(t => t.trim()))} placeholder="e.g., sci-fi, logo, python" className="mt-1 block w-full bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded-md shadow-sm sm:text-sm p-2" />
            </div>
          </div>
           <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
          </div>
        </form>
        <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          <button type="submit" form="prompt-form" onClick={handleSubmit} className="ml-3 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Save Prompt</button>
        </div>
      </div>
    </div>
  );
};
