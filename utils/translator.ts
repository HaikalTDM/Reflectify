/**
 * Translation service for hadith texts
 * Uses multiple translation APIs with fallback support
 */

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

/**
 * Option 1: Google Translate (Free via googletrans unofficial API)
 * No API key needed for basic usage
 */
async function translateWithGoogle(text: string, targetLang: string = 'ms'): Promise<string> {
  try {
    // Using Google Translate unofficial endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Parse Google Translate response
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    throw new Error('Invalid translation response');
  } catch (error) {
    console.error('Google Translate error:', error);
    throw error;
  }
}

/**
 * Option 2: LibreTranslate (Free and Open Source)
 * Self-hosted or use public instance
 */
async function translateWithLibre(text: string, targetLang: string = 'ms'): Promise<string> {
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
      }),
    });
    
    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    }
    
    throw new Error('Invalid translation response');
  } catch (error) {
    console.error('LibreTranslate error:', error);
    throw error;
  }
}

/**
 * Option 3: MyMemory Translation (Free, no API key)
 * 1000 words/day limit for free tier
 */
async function translateWithMyMemory(text: string, targetLang: string = 'ms'): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    
    throw new Error('Invalid translation response');
  } catch (error) {
    console.error('MyMemory error:', error);
    throw error;
  }
}

/**
 * Main translation function with multiple fallbacks
 * Tries Google -> LibreTranslate -> MyMemory -> Cache/Placeholder
 */
export async function translateToMalay(text: string): Promise<string> {
  // Check cache first
  const cacheKey = `en_ms_${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  // Don't translate empty strings
  if (!text || text.trim().length === 0) {
    return '[Terjemahan Melayu akan datang]';
  }
  
  // Try translation services in order
  const translators = [
    { name: 'Google', fn: translateWithGoogle },
    { name: 'MyMemory', fn: translateWithMyMemory },
    { name: 'LibreTranslate', fn: translateWithLibre },
  ];
  
  for (const translator of translators) {
    try {
      const translated = await translator.fn(text, 'ms');
      
      // Cache successful translation
      translationCache.set(cacheKey, translated);
      
      console.log(`✅ Translated via ${translator.name}`);
      return translated;
    } catch (error) {
      console.log(`❌ ${translator.name} failed, trying next...`);
      continue;
    }
  }
  
  // All translators failed, return placeholder
  console.warn('All translation services failed');
  return '[Terjemahan Melayu akan datang]';
}

/**
 * Batch translate multiple texts (more efficient)
 */
export async function batchTranslateToMalay(texts: string[]): Promise<string[]> {
  const translations = await Promise.all(
    texts.map(text => translateToMalay(text))
  );
  return translations;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache size
 */
export function getTranslationCacheSize(): number {
  return translationCache.size;
}

/**
 * Preload common translations
 */
export async function preloadCommonTranslations(): Promise<void> {
  const commonPhrases = [
    'The Prophet said',
    'It was narrated',
    'Allah\'s Messenger',
    'May Allah be pleased with him',
  ];
  
  await batchTranslateToMalay(commonPhrases);
  console.log(`Preloaded ${commonPhrases.length} common translations`);
}

