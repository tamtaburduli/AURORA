export type ValidationStatus = 'completed' | 'preliminary' | 'in-progress' | 'planned' | 'requires-validation';

export interface SiteLink { id: string; label: string; url: string | null; kind: 'file' | 'external' | 'contact' }

export interface SiteData {
  project: {
    name: string; fullName: string; tagline: string; status: string;
    question: string; mission: string; disclaimer: string;
  };
  researcher: {
    name: string; role: string; summary: string; interests: string[]; statement: string; links: SiteLink[];
  };
}

export interface Column { key: string; label: string; numeric?: boolean }
export interface ResultTable {
  id: string; title: string; unit?: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  chart?: { type: 'bar'; x: string; series: string[] };
}
export interface Experiment {
  id: string; title: string; summary: string;
  setup: Record<string, string | number>;
  tables: ResultTable[];
  interpretation: string; methodNotes: string[]; limitations: string[];
  provenance: { source: string; dataType: string; codeAvailable: boolean; rawDataPublished: boolean };
  validationStatus: ValidationStatus;
}
export interface ExperimentsData {
  globalCaveats: string[];
  metricDefinitions: { id: string; name: string; definition: string; higherIsBetter: boolean | null; definitionConfirmed: boolean }[];
  experiments: Experiment[];
}

export interface Milestone {
  id: string; title: string; status: ValidationStatus; statusConfirmed: boolean;
  period: string | null; description: string; outputs: string[];
}
export interface TimelineData { milestones: Milestone[] }

export interface Modality {
  id: string; name: string; icon: string; color: string; observables: string[];
  principles: string; contribution: string;
  experimentalStatus: 'simulated' | 'exploratory' | 'conceptual' | 'physical-prototype';
  statusDetail: string; limitations: string[]; integrated: boolean; demo: string;
}
export interface ModalitiesData { integrationNotice: string; modalities: Modality[] }

export interface RTParameter { id: string; label: string; symbol: string; unit: string; values: number[] }
export interface RTData {
  environment: { name: string; version: string | null; role: string }[];
  solver: { name: string; streams: number };
  parameters: RTParameter[];
  expectedConfigurations: number;
  lutFile: string | null;
  provenance: { source: string; validationStatus: string };
}

export interface ArchiveEntry { id: string; title: string; status: string; established: string; hypothesis: string; openQuestions: string[] }
export interface ArchiveData { notice: string; entries: ArchiveEntry[] }

export interface ManuscriptData {
  title: string; subtitle: string; authors: string[]; status: string;
  doi: string | null; venue: string | null; peerReviewStatus: string | null;
  sections: { id: string; title: string; content: string | null; draftBullets?: string[] }[];
  files: { id: string; label: string; path?: string | null; url?: string | null }[];
}

export interface ArchNode {
  id: number; short: string; title: string;
  implementation: 'conceptual' | 'computational' | 'illustrative';
  implementationConfirmed: boolean; purpose: string;
}
export interface ArchitectureData { nodes: ArchNode[] }

export interface Reference { id: string; authors: string; year: number; title: string; venue: string; topic: string; verified: boolean }
export interface ReferencesData { references: Reference[] }
