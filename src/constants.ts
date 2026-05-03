
import { Deck, Card } from './types/firebase';

export const DEMO_DECKS: Deck[] = [
  { 
    id: 'initial-deck', 
    title: 'World Capitals', 
    icon: '🌍', 
    color: '#1cb0f6', 
    category: 'Geography', 
    description: 'Master countries and their capitals.', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'math-bases', 
    title: 'Math Basics', 
    icon: '🔢', 
    color: '#58cc02', 
    category: 'STEM', 
    description: 'Essential arithmetic and concepts.', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'general-knowledge', 
    title: 'General Knowledge', 
    icon: '🧠', 
    color: '#ff4b4b', 
    category: 'Trivia', 
    description: 'A mix of facts from history, science, and pop culture.', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'guess-the-flag', 
    title: 'Guess the Flag', 
    icon: '🚩', 
    color: '#1cb0f6', 
    category: 'Geography', 
    description: 'Learn to recognize world flags at a glance!', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'space-facts', 
    title: 'Cosmic Journey', 
    icon: '🚀', 
    color: '#ce82ff', 
    category: 'Science', 
    description: 'Fascinating facts about our Universe.', 
    difficulty: 3, 
    minLevel: 3 
  },
  { 
    id: 'nature-guess', 
    title: 'Nature Guess', 
    icon: '🌿', 
    color: '#ffa500', 
    category: 'Nature', 
    description: 'Guess the animals and plants from images!', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'english-mastery', 
    title: 'English Mastery', 
    icon: '📚', 
    color: '#ce82ff', 
    category: 'Languages', 
    description: 'Master grammar, tenses, and common proverbs.', 
    difficulty: 1, 
    minLevel: 1 
  },
  { 
    id: 'advanced-science', 
    title: 'Advanced Science', 
    icon: '🧪', 
    color: '#1cb0f6', 
    category: 'STEM', 
    description: 'Deeper dive into biology and chemistry.', 
    difficulty: 2, 
    minLevel: 2 
  },
  { 
    id: 'history-legends', 
    title: 'History Legends', 
    icon: '🏰', 
    color: '#ffc800', 
    category: 'History', 
    description: 'Ancient civilizations and heroic tales.', 
    difficulty: 3, 
    minLevel: 3 
  },
  { 
    id: 'famous-monuments', 
    title: 'Famous Monuments', 
    icon: '🏛️', 
    color: '#1cb0f6', 
    category: 'Geography', 
    description: 'Identify iconic landmarks from around the globe.', 
    difficulty: 4, 
    minLevel: 4 
  },
  { 
    id: 'medical-diagnostic', 
    title: 'Medical Diagnostic', 
    icon: '🩺', 
    color: '#ff4b4b', 
    category: 'Science', 
    description: 'Can you name the disease based on these symptoms?', 
    difficulty: 4, 
    minLevel: 4 
  },
];

export const DEMO_CARDS: Record<string, Omit<Card, 'id' | 'deckId'>[]> = {
  'initial-deck': [
    { front: 'What is the capital of France?', back: 'Paris' },
    { front: 'What is the capital of Japan?', back: 'Tokyo' },
    { front: 'What is the capital of Brazil?', back: 'Brasília' },
    { front: 'What is the capital of Canada?', back: 'Ottawa' },
    { front: 'What is the capital of Australia?', back: 'Canberra' },
  ],
  'advanced-science': [
    { front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
    { front: 'What is the atomic number of Carbon?', back: '6' },
  ],
  'history-legends': [
    { front: 'Who was the first emperor of Rome?', back: 'Augustus' },
    { front: 'In what year was the Magna Carta signed?', back: '1215' },
  ],
  'math-bases': [
    { front: 'What is 12 x 12?', back: '144' },
    { front: 'What is the square root of 81?', back: '9' },
    { front: 'What is 15% of 200?', back: '30' },
    { front: 'What is 7 + 8 x 2?', back: '23', hint: 'Remember BODMAS/PEMDAS: multiply before adding.' },
    { front: 'How many degrees are in a triangle?', back: '180°' },
  ],
  'general-knowledge': [
    { front: 'Which is the largest ocean on Earth?', back: 'Pacific' },
    { front: 'Who painted the Mona Lisa?', back: 'Leonardo da Vinci' },
    { front: 'What is the chemical symbol for Gold?', back: 'Au' },
    { front: 'In which year did the Titanic sink?', back: '1912' },
    { front: 'Which planet is closest to the Sun?', back: 'Mercury' },
  ],
  'guess-the-flag': [
    { front: 'Identify this country flag.', back: 'Brazil', imageUrl: 'https://flagcdn.com/w640/br.png' },
    { front: 'Which country does this flag belong to?', back: 'Japan', imageUrl: 'https://flagcdn.com/w640/jp.png' },
    { front: 'Identify this European country flag.', back: 'Germany', imageUrl: 'https://flagcdn.com/w640/de.png' },
    { front: 'Guess the country!', back: 'Canada', imageUrl: 'https://flagcdn.com/w640/ca.png' },
    { front: 'Identify this African country flag.', back: 'South Africa', imageUrl: 'https://flagcdn.com/w640/za.png' },
  ],
  'space-facts': [
    { front: 'Which planet is known as the Red Planet?', back: 'Mars' },
    { front: 'What is the largest planet in our solar system?', back: 'Jupiter' },
    { front: 'What galaxy do we live in?', back: 'The Milky Way' },
    { front: 'How many moons does Earth have?', back: 'One' },
    { front: 'What is the closest star to Earth?', back: 'The Sun' },
  ],
  'nature-guess': [
    { front: 'What is this animal?', back: 'Lion', imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=400' },
    { front: 'Identify this tree species.', back: 'Oak', imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=400', hint: 'Known for producing acorns.' },
    { front: 'What is this beautiful flower?', back: 'Rose', imageUrl: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=400' },
    { front: 'What bird is this?', back: 'Eagle', imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&q=80&w=400' },
    { front: 'Guess this insect.', back: 'Butterfly', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=400' },
  ],
  'english-mastery': [
    { front: 'The sun ___ in the east.', back: 'Rises', hint: 'Present simple tense for universal truths.' },
    { front: 'Better late than ___.', back: 'Never', hint: 'Complete the proverb.' },
    { front: 'What is the past tense of "Go"?', back: 'Went' },
    { front: 'A ___ in need is a ___ indeed.', back: 'Friend', hint: 'The missing word is the same for both blanks.' },
    { front: 'Which is correct: "They is" or "They are"?', back: 'They are' },
  ],
  'famous-monuments': [
    { front: 'Which city is home to the Eiffel Tower?', back: 'Paris' },
    { front: 'In which city is the Faisal Mosque located?', back: 'Islamabad' },
    { front: 'Where would you find the Statue of Liberty?', back: 'New York' },
    { front: 'Which country hosts the Taj Mahal?', back: 'India' },
    { front: 'Name the city containing the Colosseum.', back: 'Rome' },
  ],
  'medical-diagnostic': [
    { front: 'Symptoms: High fever, stiff neck, and headache.', back: 'Meningitis' },
    { front: 'Symptoms: Polydipsia (thirst), polyuria, and high blood sugar.', back: 'Diabetes' },
    { front: 'Symptoms: Sudden chest pain, shortness of breath, radiating to left arm.', back: 'Heart Attack' },
    { front: 'Symptoms: wheezing, coughing, and chest tightness.', back: 'Asthma' },
  ]
};
