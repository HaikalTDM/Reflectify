// Malay translations for popular hadiths from Sahih Bukhari & Muslim
// These can be matched with API hadiths by reference number

export interface HadithTranslation {
  book: 'sahih-bukhari' | 'sahih-muslim';
  hadithNumber: string;
  text_ms: string;
}

// Store 50 most popular hadiths with Malay translations
export const malayTranslations: HadithTranslation[] = [
  {
    book: 'sahih-bukhari',
    hadithNumber: '1',
    text_ms: 'Sesungguhnya segala amalan itu bergantung kepada niatnya, dan setiap orang akan mendapat balasan sesuai dengan apa yang diniatkannya.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '13',
    text_ms: 'Tidak sempurna iman seseorang sehingga dia mencintai untuk saudaranya apa yang dia cintai untuk dirinya sendiri.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '69',
    text_ms: 'Permudahkanlah dan jangan mempersulit, gembirakanlah dan jangan membuat orang lari.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '2989',
    text_ms: 'Perkataan yang baik adalah sedekah.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6018',
    text_ms: 'Barangsiapa yang beriman kepada Allah dan Hari Akhir, hendaklah dia berkata baik atau diam.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6114',
    text_ms: 'Orang yang kuat bukanlah yang dapat mengalahkan orang lain. Sebaliknya, orang yang kuat adalah yang dapat mengendalikan dirinya ketika marah.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6465',
    text_ms: 'Amalan yang paling dicintai Allah adalah yang berterusan walaupun sedikit.',
  },
  {
    book: 'sahih-muslim',
    hadithNumber: '2594',
    text_ms: 'Kelembutan tidak ada dalam sesuatu melainkan menghiasinya, dan tidak dicabut dari sesuatu melainkan mencacatnya.',
  },
  // Add more translations as needed...
];

/**
 * Get Malay translation for a hadith by reference
 */
export function getMalayTranslation(
  book: string,
  hadithNumber: string
): string | null {
  const normalizedBook = book.toLowerCase() as 'sahih-bukhari' | 'sahih-muslim';
  
  const translation = malayTranslations.find(
    t => t.book === normalizedBook && t.hadithNumber === hadithNumber
  );
  
  return translation?.text_ms || null;
}

/**
 * Check if translation exists for a hadith
 */
export function hasTranslation(book: string, hadithNumber: string): boolean {
  return getMalayTranslation(book, hadithNumber) !== null;
}

/**
 * Get translation coverage percentage
 */
export function getTranslationCoverage(): number {
  return malayTranslations.length;
}

