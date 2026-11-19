export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

export const STORAGE_KEYS = {
  ACTIVE_SESSION: 'rag_active_session_id',
  SAVED_SESSIONS: 'rag_known_sessions',
} as const;

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_FILES_COUNT: 5,
  ALLOWED_EXTENSIONS: ['.pdf'],
  ALLOWED_MIME_TYPES: ['application/pdf'],
} as const;

export interface SuggestedQuestion {
  language: 'English' | 'Hindi' | 'Hinglish';
  flag: string;
  question: string;
  description: string;
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    language: 'English',
    flag: '🇬🇧',
    question: 'What holidays are listed in the company policy document?',
    description: 'Ask about public holidays and official leaves',
  },
  {
    language: 'Hindi',
    flag: '🇮🇳',
    question: 'कार्यालय में देर से आने (late arrival) के क्या नियम हैं?',
    description: 'कार्यालय समय और देर से आने की छूट पर जानकारी',
  },
  {
    language: 'Hinglish',
    flag: '🇮🇳',
    question: 'Working hours aur flexi-timing rules kya hain?',
    description: 'Inquire about daily working hours and flexi timings',
  },
  {
    language: 'English',
    flag: '🇬🇧',
    question: 'What are the rules regarding staff addresses and office premises?',
    description: 'Learn about office management and security protocols',
  },
];
