import { Hadith } from './hadithData';
import { getMalayTranslation } from './hadithTranslations';
import { translateToMalay } from './translator';

const API_KEY = '$2y$10$5dFKSCutokO12zw4fXBPJFdRkwyEe7TddgVFgMniwNpa951c4S';
const BASE_URL = 'https://hadithapi.com/public/api';

interface ApiHadith {
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithArabic: string;
  hadithUrdu?: string;
  headingArabic?: string;
  headingEnglish?: string;
  chapterNumber?: string;
  bookSlug: string;
  volume?: string;
  status?: string;
}

interface ApiResponse {
  hadiths: {
    data: ApiHadith[];
  };
}

// Map of available hadith books
// ✅ ONLY SAHIH (AUTHENTIC) COLLECTIONS
export const hadithBooks = {
  bukhari: 'sahih-bukhari',  // ✅ 100% Sahih - Most authentic after Quran
  muslim: 'sahih-muslim',     // ✅ 100% Sahih - Second most authentic
  // Note: Other collections contain both Sahih and non-Sahih hadiths
  // They are commented out to ensure ONLY authentic hadiths
  // abudawud: 'abu-dawood',   // Contains Da'if (weak) hadiths
  // tirmidhi: 'al-tirmidhi',  // Contains Hasan and Da'if hadiths
  // nasai: 'al-nasai',        // Contains some weak hadiths
  // ibnmajah: 'ibn-e-majah',  // Contains Da'if hadiths
  // malik: 'al-malik',        // Contains mursal (disconnected) hadiths
};

// Only use these two most authentic collections
export const SAHIH_BOOKS_ONLY = [
  hadithBooks.bukhari,
  hadithBooks.muslim,
];

// Cache for fetched hadiths
let cachedHadiths: Hadith[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validate that book is from Sahih collections only
 */
function validateSahihBook(bookSlug: string): boolean {
  return SAHIH_BOOKS_ONLY.includes(bookSlug);
}

/**
 * Fetch hadiths from the API (SAHIH ONLY)
 * Only fetches from Sahih al-Bukhari and Sahih Muslim
 */
export async function fetchHadithsFromApi(
  bookSlug: string = hadithBooks.bukhari,
  limit: number = 50
): Promise<Hadith[]> {
  // Validate that we're only using Sahih collections
  if (!validateSahihBook(bookSlug)) {
    console.warn(`Book ${bookSlug} is not from Sahih collections. Using Sahih Bukhari instead.`);
    bookSlug = hadithBooks.bukhari;
  }
  try {
    // URL encode the API key to handle special characters
    const encodedApiKey = encodeURIComponent(API_KEY);
    const url = `${BASE_URL}/hadiths?apiKey=${encodedApiKey}&book=${bookSlug}&paginate=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.hadiths?.data) {
      throw new Error('Invalid API response format');
    }

    // Transform API hadiths to our format with translations
    const hadiths: Hadith[] = await Promise.all(
      data.hadiths.data.map(async (apiHadith, index) => {
        // Try curated translation first, then auto-translate
        let malayTranslation = getMalayTranslation(bookSlug, apiHadith.hadithNumber);
        
        if (!malayTranslation && apiHadith.hadithEnglish) {
          // Auto-translate using translation API
          try {
            malayTranslation = await translateToMalay(apiHadith.hadithEnglish);
          } catch (error) {
            console.log(`Translation failed for hadith ${apiHadith.hadithNumber}`);
            malayTranslation = '[Terjemahan Melayu akan datang]';
          }
        }
        
        return {
          id: parseInt(apiHadith.hadithNumber) || index + 1,
          text_en: apiHadith.hadithEnglish || '',
          text_ar: apiHadith.hadithArabic || '',
          text_ms: malayTranslation || '[Terjemahan Melayu akan datang]',
          reference: `${formatBookName(bookSlug)}, ${apiHadith.hadithNumber}`,
          narrator: apiHadith.englishNarrator || 'Prophet Muhammad ﷺ',
          theme: apiHadith.headingEnglish || categorizeHadith(apiHadith.hadithEnglish),
        };
      })
    );

    return hadiths;
  } catch (error) {
    console.error('Error fetching hadiths from API:', error);
    throw error;
  }
}

/**
 * Get random hadith from API with caching (SAHIH ONLY)
 * Only returns hadiths from Sahih Bukhari or Sahih Muslim
 */
export async function getRandomHadithFromApi(): Promise<Hadith | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedHadiths.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      const randomIndex = Math.floor(Math.random() * cachedHadiths.length);
      return cachedHadiths[randomIndex];
    }

    // Fetch fresh hadiths - ONLY from Sahih collections
    const randomBook = SAHIH_BOOKS_ONLY[Math.floor(Math.random() * SAHIH_BOOKS_ONLY.length)];
    
    cachedHadiths = await fetchHadithsFromApi(randomBook, 50);
    lastFetchTime = now;

    const randomIndex = Math.floor(Math.random() * cachedHadiths.length);
    return cachedHadiths[randomIndex];
  } catch (error) {
    console.error('Error getting random hadith from API:', error);
    return null;
  }
}

/**
 * Fetch hadiths by specific book (SAHIH ONLY)
 * Only accepts Sahih Bukhari or Sahih Muslim
 */
export async function fetchSpecificHadith(
  collection: string,
  hadithNumber: string
): Promise<Hadith | null> {
  try {
    // Map collection to book slug
    const bookSlug = collection === 'bukhari' ? 'sahih-bukhari' : 'sahih-muslim';
    
    if (!validateSahihBook(bookSlug)) {
      throw new Error(`Only Sahih collections allowed`);
    }

    const encodedApiKey = encodeURIComponent(API_KEY);
    const url = `${BASE_URL}/hadiths?apiKey=${encodedApiKey}&book=${bookSlug}&hadithNumber=${hadithNumber}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.hadiths.data || data.hadiths.data.length === 0) {
      return null;
    }

    const apiHadith = data.hadiths.data[0];
    let malayTranslation = getMalayTranslation(bookSlug, apiHadith.hadithNumber);
    
    if (!malayTranslation && apiHadith.hadithEnglish) {
      try {
        malayTranslation = await translateToMalay(apiHadith.hadithEnglish);
      } catch (error) {
        malayTranslation = '[Terjemahan Melayu akan datang]';
      }
    }

    const bookName = bookSlug === 'sahih-bukhari' ? 'Sahih al-Bukhari' : 'Sahih Muslim';
    
    return {
      id: parseInt(apiHadith.hadithNumber) || 1,
      reference: `${bookName}, ${apiHadith.hadithNumber}`,
      text_en: apiHadith.hadithEnglish || 'Text not available',
      text_ar: apiHadith.hadithArabic || '',
      text_ms: malayTranslation || '[Terjemahan Melayu akan datang]',
      narrator: apiHadith.englishNarrator || 'Unknown',
      theme: 'Faith and Belief',
    };
  } catch (error) {
    console.error('Error fetching specific hadith:', error);
    return null;
  }
}

export async function fetchHadithsByBook(
  bookSlug: string,
  page: number = 1,
  perPage: number = 20
): Promise<Hadith[]> {
  // Validate Sahih book
  if (!validateSahihBook(bookSlug)) {
    throw new Error(`Only Sahih collections allowed. Use 'sahih-bukhari' or 'sahih-muslim'`);
  }
  try {
    const encodedApiKey = encodeURIComponent(API_KEY);
    const url = `${BASE_URL}/hadiths?apiKey=${encodedApiKey}&book=${bookSlug}&page=${page}&paginate=${perPage}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    const hadiths: Hadith[] = await Promise.all(
      data.hadiths.data.map(async (apiHadith, index) => {
        let malayTranslation = getMalayTranslation(bookSlug, apiHadith.hadithNumber);
        
        if (!malayTranslation && apiHadith.hadithEnglish) {
          try {
            malayTranslation = await translateToMalay(apiHadith.hadithEnglish);
          } catch (error) {
            malayTranslation = '[Terjemahan Melayu akan datang]';
          }
        }
        
        return {
          id: parseInt(apiHadith.hadithNumber) || (page - 1) * perPage + index + 1,
          text_en: apiHadith.hadithEnglish || '',
          text_ar: apiHadith.hadithArabic || '',
          text_ms: malayTranslation || '[Terjemahan Melayu akan datang]',
          reference: `${formatBookName(bookSlug)}, ${apiHadith.hadithNumber}`,
          narrator: apiHadith.englishNarrator || 'Prophet Muhammad ﷺ',
          theme: apiHadith.headingEnglish || categorizeHadith(apiHadith.hadithEnglish),
        };
      })
    );

    return hadiths;
  } catch (error) {
    console.error('Error fetching hadiths by book:', error);
    throw error;
  }
}

/**
 * Search hadiths by keyword (SAHIH ONLY)
 * Only searches in Sahih Bukhari or Sahih Muslim
 */
export async function searchHadiths(
  keyword: string,
  bookSlug: string = hadithBooks.bukhari
): Promise<Hadith[]> {
  // Validate Sahih book
  if (!validateSahihBook(bookSlug)) {
    console.warn(`Book ${bookSlug} is not Sahih. Using Sahih Bukhari instead.`);
    bookSlug = hadithBooks.bukhari;
  }
  try {
    const encodedApiKey = encodeURIComponent(API_KEY);
    const url = `${BASE_URL}/hadiths?apiKey=${encodedApiKey}&book=${bookSlug}&keyword=${encodeURIComponent(keyword)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    const hadiths: Hadith[] = await Promise.all(
      data.hadiths.data.map(async (apiHadith, index) => {
        let malayTranslation = getMalayTranslation(bookSlug, apiHadith.hadithNumber);
        
        if (!malayTranslation && apiHadith.hadithEnglish) {
          try {
            malayTranslation = await translateToMalay(apiHadith.hadithEnglish);
          } catch (error) {
            malayTranslation = '[Terjemahan Melayu akan datang]';
          }
        }
        
        return {
          id: parseInt(apiHadith.hadithNumber) || index + 1,
          text_en: apiHadith.hadithEnglish || '',
          text_ar: apiHadith.hadithArabic || '',
          text_ms: malayTranslation || '[Terjemahan Melayu akan datang]',
          reference: `${formatBookName(bookSlug)}, ${apiHadith.hadithNumber}`,
          narrator: apiHadith.englishNarrator || 'Prophet Muhammad ﷺ',
          theme: apiHadith.headingEnglish || categorizeHadith(apiHadith.hadithEnglish),
        };
      })
    );

    return hadiths;
  } catch (error) {
    console.error('Error searching hadiths:', error);
    throw error;
  }
}

/**
 * Format book name for display
 * Only Sahih books are used in this app
 */
function formatBookName(bookSlug: string): string {
  const bookNames: Record<string, string> = {
    'sahih-bukhari': 'Sahih al-Bukhari',
    'sahih-muslim': 'Sahih Muslim',
  };
  return bookNames[bookSlug] || 'Sahih Collection';
}

/**
 * Simple categorization based on keywords
 */
function categorizeHadith(text: string): string {
  if (!text || text.trim().length === 0) {
    return 'Faith and Belief';
  }
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('prayer') || lowerText.includes('salah') || lowerText.includes('pray')) {
    return 'Prayer';
  }
  if (lowerText.includes('charity') || lowerText.includes('sadaqah') || lowerText.includes('zakat')) {
    return 'Charity';
  }
  if (lowerText.includes('patience') || lowerText.includes('patient')) {
    return 'Patience';
  }
  if (lowerText.includes('knowledge') || lowerText.includes('learn')) {
    return 'Knowledge';
  }
  if (lowerText.includes('kind') || lowerText.includes('mercy') || lowerText.includes('compassion')) {
    return 'Kindness';
  }
  if (lowerText.includes('truth') || lowerText.includes('honest')) {
    return 'Honesty';
  }
  if (lowerText.includes('faith') || lowerText.includes('belief') || lowerText.includes('iman')) {
    return 'Faith';
  }
  if (lowerText.includes('family') || lowerText.includes('parent') || lowerText.includes('mother') || lowerText.includes('father')) {
    return 'Family';
  }
  if (lowerText.includes('brother') || lowerText.includes('friend') || lowerText.includes('neighbor')) {
    return 'Brotherhood';
  }
  
  return 'Character';
}

// Note: Malay translations are now handled by hadithTranslations.ts
// This provides a curated database of verified translations
// For hadiths without translations, a placeholder is shown

/**
 * Preload hadiths into cache (SAHIH ONLY)
 * Loads 25 from Sahih Bukhari + 25 from Sahih Muslim = 50 total
 */
export async function preloadHadiths(): Promise<void> {
  try {
    // Only use Sahih collections
    const allHadiths: Hadith[] = [];

    for (const book of SAHIH_BOOKS_ONLY) {
      const hadiths = await fetchHadithsFromApi(book, 25);
      allHadiths.push(...hadiths);
    }

    cachedHadiths = allHadiths;
    lastFetchTime = Date.now();
    
    console.log(`✅ Preloaded ${allHadiths.length} SAHIH hadiths (Bukhari + Muslim)`);
  } catch (error) {
    console.error('Error preloading hadiths:', error);
  }
}

/**
 * Clear cache (useful for refresh)
 */
export function clearHadithCache(): void {
  cachedHadiths = [];
  lastFetchTime = 0;
}

