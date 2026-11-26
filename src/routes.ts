export interface RouteDef { path: string; label: string; group: 'Research' | 'Experiments' | 'Program' | 'About' | 'Home'; blurb: string }

export const ROUTES: RouteDef[] = [
  { path: '/', label: 'Home', group: 'Home', blurb: 'Project overview' },
  { path: '/research', label: 'Research Overview', group: 'Research', blurb: 'The scientific problems motivating AURORA' },
  { path: '/architecture', label: 'System Architecture', group: 'Research', blurb: 'Interactive adaptive sensing loop' },
  { path: '/spectral', label: 'Five-Band Spectral Architecture', group: 'Research', blurb: 'Adaptive spectral selection explorer' },
  { path: '/multimodal', label: 'Multimodal Sensing', group: 'Research', blurb: 'Five candidate modalities' },
  { path: '/radiative-transfer', label: 'Radiative Transfer', group: 'Research', blurb: 'libRadtran / DISORT parameter space' },
  { path: '/mathematics', label: 'Mathematical Framework', group: 'Research', blurb: 'Inverse problems and information gain' },
  { path: '/simulator', label: 'Adaptive Sensing Simulator', group: 'Experiments', blurb: 'Illustrative fixed vs random vs adaptive' },
  { path: '/results', label: 'Experimental Results', group: 'Experiments', blurb: 'Preliminary computational results' },
  { path: '/acoustic-lab', label: 'Acoustic Laboratory', group: 'Experiments', blurb: 'Local in-browser audio analysis' },
  { path: '/validation', label: 'Novelty & Validation', group: 'Program', blurb: 'Baselines, negative results, reproducibility' },
  { path: '/timeline', label: 'Research Timeline', group: 'Program', blurb: 'Development milestones' },
  { path: '/archive', label: 'Exploratory Archive', group: 'Program', blurb: 'Speculative ideas, kept separate' },
  { path: '/manuscript', label: 'Manuscript', group: 'Program', blurb: 'Manuscript in preparation' },
  { path: '/about', label: 'About the Researcher', group: 'About', blurb: 'Tamta Burduli' },
];
