
export enum Modality {
  TEXT = 'Text',
  IMAGE = 'Image',
  VIDEO = 'Video',
  AUDIO = 'Audio',
  CODE = 'Code',
}

export interface TestResult {
  id: string;
  output: string;
  createdAt: string;
}

export interface PromptVersion {
  version: number;
  promptText: string;
  createdAt: string;
  testResults?: TestResult[];
}

export interface Prompt {
  id: string;
  title: string;
  versions: PromptVersion[];
  currentVersion: number;
  modality: Modality;
  theme: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}