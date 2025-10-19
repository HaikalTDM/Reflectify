// Malay translations for popular hadiths from Sahih Bukhari & Muslim
// These can be matched with API hadiths by reference number

export interface HadithTranslation {
  book: 'sahih-bukhari' | 'sahih-muslim';
  hadithNumber: string;
  text_ms: string;
}

// ⚠️ CRITICAL: Manual Malay translations - MUST match actual hadith content!
// When adding translations, ALWAYS verify against the actual English/Arabic text
// DO NOT copy-paste from other hadiths - verify each one individually!
export const malayTranslations: HadithTranslation[] = [
  {
    book: 'sahih-bukhari',
    hadithNumber: '1',
    // Topic: Intentions - "Deeds are according to intentions..."
    text_ms: 'Sesungguhnya segala amalan itu bergantung kepada niatnya, dan setiap orang akan mendapat balasan sesuai dengan apa yang diniatkannya.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '13',
    // Topic: Brotherhood - "None believes until he loves for his brother..."
    text_ms: 'Tidak sempurna iman seseorang sehingga dia mencintai untuk saudaranya apa yang dia cintai untuk dirinya sendiri.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '69',
    // Topic: Making things easy - "Make things easy, not difficult..."
    text_ms: 'Permudahkanlah dan jangan mempersulit, gembirakanlah dan jangan membuat orang lari.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '2989',
    // Topic: Good word as charity - "A good word is charity"
    text_ms: 'Perkataan yang baik adalah sedekah.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6018',
    // Topic: Speaking good or silent - "Whoever believes in Allah and Last Day..."
    text_ms: 'Barangsiapa yang beriman kepada Allah dan Hari Akhir, hendaklah dia berkata baik atau diam.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6114',
    // Topic: Controlling anger - "The strong person is not the one who can wrestle..."
    text_ms: 'Orang yang kuat bukanlah yang dapat mengalahkan orang lain. Sebaliknya, orang yang kuat adalah yang dapat mengendalikan dirinya ketika marah.',
  },
  {
    book: 'sahih-bukhari',
    hadithNumber: '6465',
    // Topic: Consistency - "Most beloved deeds are those done consistently..."
    text_ms: 'Amalan yang paling dicintai Allah adalah yang berterusan walaupun sedikit.',
  },
  {
    book: 'sahih-muslim',
    hadithNumber: '2594',
    // Topic: Fasting in junub state - "He asked Umm Salama about fasting while junub..."
    text_ms: 'Dia bertanya kepada Ummu Salamah رضي الله عنها sama ada seseorang yang bangun pada waktu pagi dalam keadaan junub perlu berpuasa. Beliau menjawab: Rasulullah ﷺ kadang-kadang bangun pada waktu pagi dalam keadaan junub, bukan kerana mimpi basah (tetapi kerana bersetubuh pada waktu malam), kemudian baginda berpuasa.',
  },
  // Add more translations as needed - ALWAYS verify content matches the hadith number!
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

