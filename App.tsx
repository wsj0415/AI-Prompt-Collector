
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { PromptModal } from './components/PromptModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { PromptDetailView } from './components/PromptDetailView';
import { findRelevantPrompts, runPromptTest, evaluateTestResult } from './services/geminiService';
import type { Prompt, PromptVersion, TestResult, Evaluation } from './types';
import { Modality } from './types';
import { useToast } from './components/Toast';
import { 
    PlusIcon, EditIcon, DeleteIcon, SearchIcon, 
    SparklesIcon, CopyIcon, CheckIcon, CollectionIcon, StatsIcon, ImportIcon, 
    ExportIcon, TextIcon, ImageIcon, VideoIcon, AudioIcon, CodeIcon, GridIcon,
    SunIcon, MoonIcon, HashtagIcon
} from './components/icons';

const StatisticsView = lazy(() => import('./components/StatisticsView'));


type Theme = 'light' | 'dark';

const getActivePromptText = (prompt: Prompt | null): string => {
    if (!prompt || !prompt.versions || prompt.versions.length === 0) return '';
    const activeVersion = prompt.versions.find(v => v.version === prompt.currentVersion);
    return activeVersion ? activeVersion.promptText : '';
};

// Data migration function for backward compatibility
const migratePrompts = (data: any[]): Prompt[] => {
    return data.map(item => {
        if (item.promptText && !item.versions) {
            // This is the old format
            return {
                ...item,
                versions: [{
                    version: 1,
                    promptText: item.promptText,
                    createdAt: item.createdAt || new Date().toISOString()
                }],
                currentVersion: 1,
                promptText: undefined, // remove old property
            };
        }
        return item;
    });
};


const App: React.FC = () => {
  const { addToast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    try {
      const savedData = localStorage.getItem('prompts');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      if (parsedData.length > 0) {
        return migratePrompts(parsedData);
      }
      // DEMO DATA if no saved data
      return [
           {id: "1", title: "Sci-Fi Spaceship Concept Art", versions: [{version: 1, promptText: "Generate a concept art of a sleek, futuristic spaceship exploring a nebula. The design should be minimalist with glowing blue accents. Style of Syd Mead.", createdAt: "2025-10-26T10:00:00Z", testResults: []}], currentVersion: 1, modality: Modality.IMAGE, theme: "Concept Art", tags: ["sci-fi", "spaceship", "Syd Mead"], notes: "Great for generating desktop wallpapers. Adding '4K resolution' can improve quality.", createdAt: "2025-10-26T10:00:00Z"},
           {id: "2", title: "Python Function for Data Cleaning", versions: [{version: 1, promptText: "Write a Python function that takes a pandas DataFrame as input and removes duplicate rows, fills missing numerical values with the mean, and trims whitespace from all string columns.", createdAt: "2025-10-26T11:00:00Z", testResults: []}], currentVersion: 1, modality: Modality.CODE, theme: "Data Science", tags: ["python", "pandas", "data cleaning"], notes: "", createdAt: "2025-10-26T11:00:00Z"},
           {id: "3", title: "Marketing Copy for a Coffee Shop", versions: [{version: 1, promptText: "Create a short, catchy marketing paragraph for a new artisanal coffee shop. Emphasize the cozy atmosphere, ethically sourced beans, and skilled baristas. Tone should be warm and inviting.", createdAt: "2025-10-26T12:00:00Z", testResults: []}], currentVersion: 1, modality: Modality.TEXT, theme: "Marketing Copy", tags: ["coffee", "advertising", "local business"], notes: "Can be adapted for social media posts or website copy.", createdAt: "2025-10-26T12:00:00Z"},
           {id: "4", title: "Epic Movie Trailer VO", versions: [{version: 1, promptText: "Generate a voice-over script for an epic fantasy movie trailer. The tone should be deep, dramatic, and mysterious. Include phrases like 'In a world of shadow...' and 'A hero will rise.'.", createdAt: "2025-10-25T14:00:00Z", testResults: []}], currentVersion: 1, modality: Modality.AUDIO, theme: "Voice Over", tags: ["movie trailer", "fantasy", "dramatic"], notes: "", createdAt: "2025-10-25T14:00:00Z"},
           {id: "5", title: "Short cooking tutorial video", versions: [{version: 1, promptText: "A 1-minute video showing how to make a perfect omelette. Start with ingredients display, show cracking eggs, whisking, pouring into a hot pan, and the final flip. Upbeat background music.", createdAt: "2025-10-24T18:00:00Z", testResults: []}], currentVersion: 1, modality: Modality.VIDEO, theme: "Cooking Tutorial", tags: ["food", "cooking", "short video"], notes: "", createdAt: "2025-10-24T18:00:00Z"},
      ];
    } catch (error) {
      console.error("Failed to parse prompts from localStorage", error);
      return [];
    }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [view, setView] = useState<'list' | 'stats'>('list');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearch, setIsAiSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [modalityFilter, setModalityFilter] = useState<Modality | null>(null);
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [promptToDeleteId, setPromptToDeleteId] = useState<string | null>(null);

  const ChartLoadingFallback = () => (
    <div className="flex justify-center items-center h-full bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[500px]">
      <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading Statistics...</p>
    </div>
  );


  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('prompts', JSON.stringify(prompts));
  }, [prompts]);

  const handleAiSearch = useCallback(async (promptsToSearch: Prompt[]) => {
    if (!searchQuery.trim()) {
        setFilteredPrompts(promptsToSearch);
        return;
    }
    setIsSearching(true);
    setSearchError('');
    try {
        const relevantIds = await findRelevantPrompts(promptsToSearch, searchQuery);
        const relevantPrompts = promptsToSearch
          .filter(p => relevantIds.includes(p.id))
          .sort((a, b) => relevantIds.indexOf(a.id) - relevantIds.indexOf(b.id));
        setFilteredPrompts(relevantPrompts);
    } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'An unknown search error occurred.');
        setFilteredPrompts([]);
    } finally {
        setIsSearching(false);
    }
  }, [searchQuery]);

  const topThemes = useMemo(() => {
    const themeCounts = prompts.reduce((acc, prompt) => {
        if (prompt.theme) {
            acc[prompt.theme] = (acc[prompt.theme] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(themeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme);
  }, [prompts]);

  const displayedPrompts = useMemo(() => {
    const promptsAfterFilters = prompts
      .filter(p => !modalityFilter || p.modality === modalityFilter)
      .filter(p => !themeFilter || p.theme === themeFilter);

    let promptsToDisplay: Prompt[];

    if (!searchQuery.trim()) {
      promptsToDisplay = promptsAfterFilters;
    } else if (isAiSearch) {
      promptsToDisplay = filteredPrompts;
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      promptsToDisplay = promptsAfterFilters.filter(p =>
        p.title.toLowerCase().includes(lowerCaseQuery) ||
        getActivePromptText(p).toLowerCase().includes(lowerCaseQuery) ||
        p.theme.toLowerCase().includes(lowerCaseQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    return [...promptsToDisplay].sort((a, b) => {
        const [sortField, sortOrder] = sortBy.split('-');
        const order = sortOrder === 'asc' ? 1 : -1;

        if (sortField === 'title') {
            return a.title.localeCompare(b.title) * order;
        }
        if (sortField === 'createdAt') {
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
        }
        return 0;
    });

  }, [prompts, modalityFilter, themeFilter, searchQuery, isAiSearch, filteredPrompts, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiSearch) {
        const promptsToSearch = prompts
            .filter(p => !modalityFilter || p.modality === modalityFilter)
            .filter(p => !themeFilter || p.theme === themeFilter);
        handleAiSearch(promptsToSearch);
    }
  }


  const handleSavePrompt = (prompt: Prompt) => {
    const isEditing = prompts.some(p => p.id === prompt.id);
    if (isEditing) {
        setPrompts(prompts.map(p => p.id === prompt.id ? prompt : p));
        addToast('Prompt updated successfully!', 'success');
    } else {
        setPrompts(prevPrompts => [prompt, ...prevPrompts]);
        addToast('Prompt created successfully!', 'success');
    }
  };
  
  const handleChangeVersion = (promptId: string, version: number) => {
    setPrompts(currentPrompts =>
        currentPrompts.map(p => {
            if (p.id === promptId) {
                return { ...p, currentVersion: version };
            }
            return p;
        })
    );
    // Also update the selectedPrompt if it's the one being changed
    setSelectedPrompt(currentSelected => 
        currentSelected?.id === promptId ? { ...currentSelected, currentVersion: version } : currentSelected
    );
    addToast(`Set Version ${version} as active.`, 'info');
  };

  const handleRunTest = async (promptId: string) => {
    const promptToTest = prompts.find(p => p.id === promptId);
    if (!promptToTest) return;

    const activeVersion = promptToTest.versions.find(v => v.version === promptToTest.currentVersion);
    if (!activeVersion) return;

    try {
      const output = await runPromptTest(activeVersion.promptText);
      const newTestResult: TestResult = {
        id: new Date().toISOString(),
        output,
        createdAt: new Date().toISOString(),
      };

      const updatePromptWithTestResult = (prompt: Prompt): Prompt => {
        const updatedVersions = prompt.versions.map(v => {
          if (v.version === prompt.currentVersion) {
            return {
              ...v,
              testResults: [newTestResult, ...(v.testResults || [])],
            };
          }
          return v;
        });
        return { ...prompt, versions: updatedVersions };
      };

      setPrompts(currentPrompts =>
        currentPrompts.map(p => (p.id === promptId ? updatePromptWithTestResult(p) : p))
      );
      
      setSelectedPrompt(currentSelected =>
        currentSelected?.id === promptId ? updatePromptWithTestResult(currentSelected) : currentSelected
      );
      
      addToast('Test completed successfully!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Test failed.', 'error');
    }
  };

  const handleEvaluateTest = async (promptId: string, testResultId: string) => {
    const promptToEvaluate = prompts.find(p => p.id === promptId);
    if (!promptToEvaluate) return;

    const activeVersion = promptToEvaluate.versions.find(v => v.version === promptToEvaluate.currentVersion);
    const testResult = activeVersion?.testResults?.find(t => t.id === testResultId);

    if (!activeVersion || !testResult) return;

    try {
      const evaluation = await evaluateTestResult(activeVersion.promptText, testResult.output);

      const updatePromptWithEvaluation = (prompt: Prompt): Prompt => {
        const updatedVersions = prompt.versions.map(v => {
          if (v.version === prompt.currentVersion) {
            const updatedTestResults = v.testResults?.map(t => {
              if (t.id === testResultId) {
                return { ...t, evaluation };
              }
              return t;
            });
            return { ...v, testResults: updatedTestResults };
          }
          return v;
        });
        return { ...prompt, versions: updatedVersions };
      };

      setPrompts(currentPrompts =>
        currentPrompts.map(p => (p.id === promptId ? updatePromptWithEvaluation(p) : p))
      );
      
      setSelectedPrompt(currentSelected =>
        currentSelected?.id === promptId ? updatePromptWithEvaluation(currentSelected) : currentSelected
      );

      addToast(`Evaluation complete! Score: ${evaluation.score}/10`, 'success');
    } catch (error) {
       addToast(error instanceof Error ? error.message : 'Evaluation failed.', 'error');
    }
  };

  const handleAddPrompt = () => {
    setPromptToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(null); // Close detail view if open
    setPromptToEdit(prompt);
    setIsModalOpen(true);
  };
  
  const handleRequestDelete = (id: string) => {
    setPromptToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleDeletePrompt = () => {
    if (promptToDeleteId) {
        setPrompts(currentPrompts => currentPrompts.filter(p => p.id !== promptToDeleteId));
        if (selectedPrompt?.id === promptToDeleteId) {
            setSelectedPrompt(null);
        }
        addToast('Prompt deleted.', 'info');
        setPromptToDeleteId(null);
        setIsConfirmModalOpen(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Prompt copied to clipboard!', 'success');
  };

  const handleExportPrompts = () => {
    if (prompts.length === 0) {
      addToast('No prompts to export.', 'info');
      return;
    }

    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-prompts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Prompts exported successfully!', 'success');
  };
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        addToast('Please select a .csv file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
            addToast('Could not read the file.', 'error');
            return;
        }

        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                throw new Error("CSV file is empty or has only a header.");
            }
            
            const headerLine = lines[0].trim();
            // A simple CSV parser to handle quoted fields.
            const parseCsvLine = (line: string): string[] => {
                const result: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"' && (i === 0 || line[i-1] !== '\\')) { // Handle escaped quotes later if needed
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim().replace(/^"|"$/g, ''));
                return result;
            }

            const header = parseCsvLine(headerLine);
            const expectedHeader = ['id', 'title', 'promptText', 'modality', 'theme', 'tags', 'notes', 'createdAt'];
            
            if(header.length !== expectedHeader.length || !header.every((h, i) => h === expectedHeader[i])) {
                 throw new Error(`Invalid CSV header. Expected: ${expectedHeader.join(',')}`);
            }
            
            const headerMap = header.reduce((acc, h, i) => ({...acc, [h]: i}), {} as Record<string, number>);

            const existingIds = new Set(prompts.map(p => p.id));
            const newPrompts: Prompt[] = [];
            let skippedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = parseCsvLine(lines[i]);
                if (values.length !== header.length) {
                    console.warn(`Skipping malformed row: ${lines[i]}`);
                    continue;
                }

                const id = values[headerMap.id];
                if (!id) continue;

                if (existingIds.has(id)) {
                    skippedCount++;
                    continue;
                }
                
                const modality = values[headerMap.modality] as Modality;
                if (!Object.values(Modality).includes(modality)) {
                    console.warn(`Skipping row with invalid modality: ${modality}`);
                    continue;
                }

                const promptText = values[headerMap.promptText];
                const prompt: Prompt = {
                    id,
                    title: values[headerMap.title],
                    versions: [{ version: 1, promptText, createdAt: values[headerMap.createdAt] || new Date().toISOString() }],
                    currentVersion: 1,
                    modality,
                    theme: values[headerMap.theme],
                    tags: values[headerMap.tags] ? values[headerMap.tags].split(',').map(t => t.trim()) : [],
                    notes: values[headerMap.notes],
                    createdAt: values[headerMap.createdAt] || new Date().toISOString(),
                };
                newPrompts.push(prompt);
                existingIds.add(id);
            }

            if (newPrompts.length > 0) {
                 setPrompts(prev => [...prev, ...newPrompts]);
                 addToast(`Successfully imported ${newPrompts.length} prompts.`, 'success');
            } else {
                 addToast('No new prompts were imported.', 'info');
            }

            if (skippedCount > 0) {
                addToast(`Skipped ${skippedCount} prompts with duplicate IDs.`, 'info');
            }

        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to parse CSV file.', 'error');
        } finally {
            if(event.target) {
                event.target.value = '';
            }
        }
    };
    reader.onerror = () => {
         addToast('Error reading file.', 'error');
    };
    reader.readAsText(file);
  };

  const handleCardClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const modalityIcons: Record<Modality, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [Modality.TEXT]: TextIcon,
    [Modality.IMAGE]: ImageIcon,
    [Modality.VIDEO]: VideoIcon,
    [Modality.AUDIO]: AudioIcon,
    [Modality.CODE]: CodeIcon,
  };
  
  const modalityFilters = [
    { name: 'All Prompts', value: null, icon: GridIcon },
    ...Object.values(Modality).map(m => ({ name: m, value: m, icon: modalityIcons[m] }))
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center justify-center px-4 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">AI Prompt Collector</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
            <button
              onClick={handleAddPrompt}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Prompt</span>
            </button>
            <div className="space-y-2">
                 <a href="#" onClick={() => setView('list')} className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${view === 'list' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <CollectionIcon className="w-5 h-5"/> <span>Collection</span>
                </a>
                 <a href="#" onClick={() => setView('stats')} className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${view === 'stats' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <StatsIcon className="w-5 h-5"/> <span>Statistics</span>
                </a>
            </div>
            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter by Modality</h3>
                {modalityFilters.map(({ name, value, icon: Icon }) => (
                    <button
                        key={name}
                        onClick={() => setModalityFilter(value)}
                        className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${modalityFilter === value ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        <Icon className="w-5 h-5" />
                        <span>{name}</span>
                    </button>
                ))}
            </div>
            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                    <HashtagIcon className="w-4 h-4 mr-2" />
                    Quick Filters
                </h3>
                <div className="px-3 flex flex-wrap gap-2">
                    {topThemes.length > 0 ? topThemes.map((theme) => (
                        <button
                            key={theme}
                            onClick={() => setThemeFilter(current => current === theme ? null : theme)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                themeFilter === theme 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {theme}
                        </button>
                    )) : <p className="text-xs text-gray-500 px-1">No themes yet.</p>}
                </div>
            </div>
        </nav>
         <div className="px-4 py-4 border-t dark:border-gray-700 space-y-2">
             <button
                onClick={handleThemeToggle}
                className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileImport}
             />
            <button onClick={handleImportClick} className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                <ImportIcon className="w-5 h-5"/><span>Import</span>
            </button>
            <button onClick={handleExportPrompts} className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                <ExportIcon className="w-5 h-5"/><span>Export</span>
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center px-6 justify-between">
            {view === 'list' && (
              <>
                <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Semantic search for prompts (e.g., 'futuristic car design')..."
                        className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                         <label htmlFor="ai-search-toggle" className="flex items-center cursor-pointer p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Toggle AI-powered semantic search">
                            <SparklesIcon className={`w-5 h-5 transition-colors ${isAiSearch ? 'text-primary-500' : 'text-gray-400'}`}/>
                            <input type="checkbox" id="ai-search-toggle" className="sr-only" checked={isAiSearch} onChange={() => setIsAiSearch(!isAiSearch)} />
                        </label>
                        {isAiSearch && (
                             <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-primary-600 text-white px-4 py-1 rounded-md text-sm flex items-center hover:bg-primary-700 disabled:bg-gray-400"
                            >
                                {isSearching ? 'Searching...' : 'AI Search'}
                            </button>
                        )}
                    </div>
                </form>
                 <div className="flex items-center ml-4">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                    </select>
                </div>
              </>
            )}
             {searchError && <p className="text-red-500 text-sm ml-4">{searchError}</p>}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedPrompts.length > 0 ? (
                displayedPrompts.map(prompt => (
                  <div key={prompt.id} className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border dark:border-gray-700 flex flex-col cursor-pointer" onClick={() => handleCardClick(prompt)}>
                    <div className="p-5 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                           <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex-1 pr-2">{prompt.title}</h2>
                           <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                               {React.createElement(modalityIcons[prompt.modality], { className: "w-4 h-4"})}
                               <span className={`text-xs font-medium`}>
                                {prompt.modality}
                               </span>
                           </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4">{getActivePromptText(prompt)}</p>
                    </div>
                    <div className="px-5 pb-4">
                         {prompt.theme && 
                            <div className="mb-3">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2">Theme:</span>
                                <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-primary-900 dark:text-primary-300">{prompt.theme}</span>
                            </div>
                         }
                        <div className="flex flex-wrap gap-2">
                          {prompt.tags.slice(0, 3).map(tag => tag && <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                        </div>
                    </div>
                    <div className="flex justify-end items-center px-3 pb-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleCopyPrompt(getActivePromptText(prompt))} className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Copy Prompt">
                        <CopyIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleEditPrompt(prompt)} className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit"><EditIcon className="w-5 h-5"/></button>
                      <button onClick={() => handleRequestDelete(prompt.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete"><DeleteIcon className="w-5 h-5"/></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">
                    <h2 className="text-2xl font-bold">No Prompts Found</h2>
                    <p>{searchQuery || modalityFilter || themeFilter ? "Try adjusting your filters or search term." : "Click 'Add Prompt' to get started."}</p>
                </div>
              )}
            </div>
          ) : (
            <Suspense fallback={<ChartLoadingFallback />}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <StatisticsView prompts={prompts} />
              </div>
            </Suspense>
          )}
        </main>
      </div>
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
        promptToEdit={promptToEdit}
      />
      <PromptDetailView
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onEdit={handleEditPrompt}
        onDelete={handleRequestDelete}
        onCopy={handleCopyPrompt}
        onChangeVersion={handleChangeVersion}
        onRunTest={handleRunTest}
        onEvaluateTest={handleEvaluateTest}
      />
       <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeletePrompt}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
      />
    </div>
  );
};

export default App;
