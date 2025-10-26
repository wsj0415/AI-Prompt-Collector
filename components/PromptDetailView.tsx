import React from 'react';
import type { Prompt } from '../types';
import { Modality } from '../types';
import { 
    XIcon, CopyIcon, EditIcon, DeleteIcon,
    TextIcon, ImageIcon, VideoIcon, AudioIcon, CodeIcon
} from './icons';

interface PromptDetailViewProps {
  prompt: Prompt | null;
  onClose: () => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}

const modalityIcons: Record<Modality, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [Modality.TEXT]: TextIcon,
    [Modality.IMAGE]: ImageIcon,
    [Modality.VIDEO]: VideoIcon,
    [Modality.AUDIO]: AudioIcon,
    [Modality.CODE]: CodeIcon,
};

export const PromptDetailView: React.FC<PromptDetailViewProps> = ({ prompt, onClose, onEdit, onDelete, onCopy }) => {
  if (!prompt) return null;

  const ModalityIcon = modalityIcons[prompt.modality];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prompt</h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">{prompt.promptText}</p>
            </div>
          </div>

          {prompt.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">{prompt.notes}</p>
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

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl space-x-3">
          <button onClick={() => onCopy(prompt.promptText)} className="px-4 py-2 text-sm font-medium flex items-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
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
  );
};