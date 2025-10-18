/**
 * Pre-generation Script: Save to Local JSON Files
 * 
 * This is the SIMPLE version - no Supabase required!
 * Questions saved to JSON files that you bundle with your app.
 * 
 * Perfect for:
 * - Quick start without Supabase setup
 * - 100% offline app
 * - Simple deployment
 * 
 * Usage:
 *   npm run pregenerate
 *   or
 *   npx ts-node scripts/pregenerateToFile.ts
 * 
 * Output:
 *   → pregenerated/questions_bukhari.json
 *   → pregenerated/questions_muslim.json
 *   → pregenerated/questions_all.json (combined)
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { fetchHadithsFromApi, hadithBooks } from '../utils/hadithApi';
import { generateQuestionsWithDeepSeek } from '../utils/deepseekQuestionGenerator';
import { QuizQuestion } from '../utils/hadithQuestions';

const OUTPUT_DIR = path.join(__dirname, 'pregenerated');
const IS_TEST_MODE = process.argv.includes('--test');

// Delay between API calls (in milliseconds)
// 1000ms = 1s (60 req/min, very safe)
// 500ms = 0.5s (120 req/min, recommended)
// 200ms = 0.2s (300 req/min, aggressive but fast)
const DELAY_MS = 200; // Currently set to 0.2s for faster generation

interface PregeneratedEntry {
  hadithReference: string;
  hadithText: string;
  theme: string;
  questions: QuizQuestion[];
  generatedAt: string;
  generatedBy: 'deepseek';
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  errors: Array<{ hadith: string; error: string }>;
}

const stats: Stats = {
  total: 0,
  successful: 0,
  failed: 0,
  totalCost: 0,
  errors: [],
};

const COST_PER_HADITH = 0.00018; // USD
const USD_TO_MYR = 4.70;

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
  }
}

/**
 * Generate questions for a single hadith
 */
async function generateForHadith(
  hadithText: string,
  hadithReference: string,
  theme: string
): Promise<PregeneratedEntry | null> {
  try {
    console.log(`   🤖 Generating questions...`);
    
    const questions = await generateQuestionsWithDeepSeek(
      hadithText,
      hadithReference,
      theme,
      'en' // English only for now (faster generation)
    );
    
    if (!questions || questions.length === 0) {
      throw new Error('No questions generated');
    }
    
    console.log(`   ✅ Generated ${questions.length} questions`);
    
    stats.successful++;
    stats.totalCost += COST_PER_HADITH;
    
    return {
      hadithReference,
      hadithText,
      theme,
      questions,
      generatedAt: new Date().toISOString(),
      generatedBy: 'deepseek',
    };
  } catch (error: any) {
    console.error(`   ❌ Error: ${error?.message || error}`);
    stats.failed++;
    stats.errors.push({
      hadith: hadithReference,
      error: error?.message || String(error),
    });
    return null;
  }
}

/**
 * Delay between API calls
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Save to JSON file
 */
function saveToFile(filename: string, data: PregeneratedEntry[]): void {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 Saved to: ${filepath}`);
}

/**
 * Main pre-generation process
 */
async function pregenerateToFiles() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Reflectify: Pre-Generate Questions to JSON Files    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  if (IS_TEST_MODE) {
    console.log('⚠️  TEST MODE: Processing first 5 hadiths only\n');
  }
  
  ensureOutputDir();
  
  const allEntries: PregeneratedEntry[] = [];
  const bukhariEntries: PregeneratedEntry[] = [];
  const muslimEntries: PregeneratedEntry[] = [];
  
  const startTime = Date.now();
  
  try {
    // Process Sahih Bukhari
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 SAHIH AL-BUKHARI');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const bukhariLimit = IS_TEST_MODE ? 5 : 100;
    console.log(`Fetching ${bukhariLimit} hadiths from Sahih Bukhari...\n`);
    
    const bukhariHadiths = await fetchHadithsFromApi(
      hadithBooks.bukhari,
      bukhariLimit
    );
    
    console.log(`✅ Fetched ${bukhariHadiths.length} hadiths\n`);
    stats.total += bukhariHadiths.length;
    
    for (let i = 0; i < bukhariHadiths.length; i++) {
      const hadith = bukhariHadiths[i];
      console.log(`[${i + 1}/${bukhariHadiths.length}] ${hadith.reference}`);
      
      const entry = await generateForHadith(
        hadith.text_en,
        hadith.reference,
        hadith.theme
      );
      
      if (entry) {
        bukhariEntries.push(entry);
        allEntries.push(entry);
      }
      
      // Delay to avoid rate limits
      if (i < bukhariHadiths.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_MS}ms...\n`);
        await delay(DELAY_MS);
      }
    }
    
    // Save Bukhari file
    console.log('\n💾 Saving Bukhari questions...');
    saveToFile('questions_bukhari.json', bukhariEntries);
    console.log(`✅ Saved ${bukhariEntries.length} Bukhari hadiths\n`);
    
    // Process Sahih Muslim
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 SAHIH MUSLIM');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const muslimLimit = IS_TEST_MODE ? 5 : 100;
    console.log(`Fetching ${muslimLimit} hadiths from Sahih Muslim...\n`);
    
    const muslimHadiths = await fetchHadithsFromApi(
      hadithBooks.muslim,
      muslimLimit
    );
    
    console.log(`✅ Fetched ${muslimHadiths.length} hadiths\n`);
    stats.total += muslimHadiths.length;
    
    for (let i = 0; i < muslimHadiths.length; i++) {
      const hadith = muslimHadiths[i];
      console.log(`[${i + 1}/${muslimHadiths.length}] ${hadith.reference}`);
      
      const entry = await generateForHadith(
        hadith.text_en,
        hadith.reference,
        hadith.theme
      );
      
      if (entry) {
        muslimEntries.push(entry);
        allEntries.push(entry);
      }
      
      // Delay to avoid rate limits
      if (i < muslimHadiths.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_MS}ms...\n`);
        await delay(DELAY_MS);
      }
    }
    
    // Save Muslim file
    console.log('\n💾 Saving Muslim questions...');
    saveToFile('questions_muslim.json', muslimEntries);
    console.log(`✅ Saved ${muslimEntries.length} Muslim hadiths\n`);
    
    // Save combined file
    console.log('💾 Saving combined file...');
    saveToFile('questions_all.json', allEntries);
    console.log(`✅ Saved ${allEntries.length} total hadiths\n`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
  
  // Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  GENERATION COMPLETE                                  ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Statistics:');
  console.log(`   Total processed: ${stats.total}`);
  console.log(`   Successful: ${stats.successful} ✅`);
  console.log(`   Failed: ${stats.failed} ❌`);
  console.log(`   Success rate: ${stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%`);
  console.log(`   Duration: ${minutes}m ${seconds}s`);
  
  console.log('\n💰 Cost:');
  console.log(`   Total API calls: ${stats.successful}`);
  console.log(`   Cost (USD): $${stats.totalCost.toFixed(4)}`);
  console.log(`   Cost (MYR): RM ${(stats.totalCost * USD_TO_MYR).toFixed(2)}`);
  console.log(`   Per hadith: RM ${(COST_PER_HADITH * USD_TO_MYR).toFixed(4)}`);
  
  console.log('\n📁 Output Files:');
  console.log(`   ${OUTPUT_DIR}/questions_bukhari.json (${bukhariEntries.length} hadiths)`);
  console.log(`   ${OUTPUT_DIR}/questions_muslim.json (${muslimEntries.length} hadiths)`);
  console.log(`   ${OUTPUT_DIR}/questions_all.json (${allEntries.length} hadiths)`);
  
  const totalSize = JSON.stringify(allEntries).length;
  const sizeKB = (totalSize / 1024).toFixed(2);
  console.log(`   Total size: ${sizeKB} KB`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.slice(0, 10).forEach(err => {
      console.log(`   - ${err.hadith}: ${err.error}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
  
  console.log('\n📦 Next Steps:');
  console.log('   1. Copy pregenerated/ folder to your app');
  console.log('   2. Load questions from JSON at app startup');
  console.log('   3. All users get instant questions! ⚡');
  console.log('\n✅ Pre-generation complete!\n');
}

/**
 * Run the script
 */
if (require.main === module) {
  pregenerateToFiles()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { pregenerateToFiles };

