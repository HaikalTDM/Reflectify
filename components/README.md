# Components

This directory contains reusable React Native components for the Reflectify app.

## Components

### CountdownTimer.tsx
A 30-second countdown timer with visual progress indicator.

**Props:**
- `duration` (number): Timer duration in seconds
- `onComplete` (function): Callback when timer completes
- `isDark` (boolean): Dark mode flag for styling

**Features:**
- Circular timer display
- Linear progress bar
- Animated countdown
- Formatted time display (MM:SS)

### HadithCard.tsx
A card component to display hadith text with reference.

**Props:**
- `hadith` (Hadith): Hadith object with text and metadata
- `isDark` (boolean): Dark mode flag for styling
- `language` ('en' | 'ar' | 'both'): Display language

**Features:**
- Bilingual support (Arabic & English)
- Theme badge
- Reference citation
- Scrollable content
- Responsive design

## Usage Example

```tsx
import CountdownTimer from '../components/CountdownTimer';
import HadithCard from '../components/HadithCard';

// In your component
<CountdownTimer 
  duration={30} 
  onComplete={() => console.log('Done!')}
  isDark={false}
/>

<HadithCard 
  hadith={hadithObject}
  isDark={false}
  language="en"
/>
```

## Styling

All components use NativeWind (Tailwind CSS) for styling. The design follows the app's color scheme:
- White: #ffffff (70%)
- Black: #1a1a1a (20%)
- Gold: #d4af37 (10%)

