import type { Project } from '../types'

export const projects: Project[] = [
  {
    id: 'fertiscale',
    name: 'Fertiscale',
    tagline: 'Agriculture du futur',
    description:
      "Application mobile + backend + web pour l'agriculture de précision. Gestion de parcelles, analyse NDVI, biomasse, intégration cadastrale.",
    category: 'Agri-Tech / Geospatial',
    position: [0, 0, 0],
    color: '#4CAF50',
    type: 'terrain',
    techStack: ['React Native', 'Python', 'PostGIS', 'NDVI'],
    timeline: {
      start: '2023-01',
      milestones: [
        'Conception architecture',
        'Développement mobile React Native',
        'Backend API Python',
        'Intégration géospatiale',
        'Dashboard web analytics',
        'MVP déployé',
      ],
    },
  },
  {
    id: 'godsplan',
    name: 'godsPlan',
    tagline: 'Paris spirituel',
    description:
      'Application recensant les églises de Paris avec horaires de messes, scraping multi-sources pour données en temps réel.',
    category: 'Web / Data Scraping',
    position: [0, 0, 0],
    color: '#FFD700',
    type: 'metallic',
    techStack: ['React', 'Node.js', 'Puppeteer', 'MongoDB'],
  },
  {
    id: 'lesyndrome',
    name: 'Le Syndrome',
    tagline: 'Album piano original',
    description:
      'Projet musical personnel — album de compositions au piano. Une exploration sonore et émotionnelle.',
    category: 'Music / Creative',
    position: [0, 0, 0],
    color: '#9C27B0',
    type: 'audio',
    techStack: ['Piano', 'Ableton Live', 'Web Audio API'],
    audioPath: '/audio/lesyndrome.mp3',
  },
]
