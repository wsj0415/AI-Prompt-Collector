
export enum Modality {
  TEXT = 'Text',
  IMAGE = 'Image',
  VIDEO = 'Video',
  AUDIO = 'Audio',
  CODE = 'Code',
}

export interface Prompt {
  id: string;
  title: string;
  promptText: string;
  modality: Modality;
  theme: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}
