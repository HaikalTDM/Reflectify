# Utils

Utility functions and data for the Reflectify app.

## Files

### hadithData.ts
Contains a collection of authentic (Sahih) hadiths with English and Arabic text.

**Exports:**
- `Hadith` interface
- `hadithCollection`: Array of 10 authentic hadiths
- `getRandomHadith()`: Returns a random hadith
- `getHadithById(id)`: Returns specific hadith by ID

**Data Structure:**
```typescript
interface Hadith {
  id: number;
  text_en: string;
  text_ar: string;
  reference: string;  // e.g., "Sahih al-Bukhari, 6018"
  narrator: string;   // e.g., "Prophet Muhammad ﷺ"
  theme: string;      // e.g., "Character", "Speech"
}
```

### notification.ts
Handles all notification-related functionality using Expo Notifications.

**Exports:**
- `registerForPushNotificationsAsync()`: Request permissions
- `scheduleReflectionNotification(frequency)`: Schedule based on frequency
- `cancelAllNotifications()`: Clear all scheduled notifications
- `getScheduledNotifications()`: Get list of pending notifications

**Frequency Options:**
- `manual`: No automatic scheduling
- `daily`: Random time between 10 AM - 7 PM
- `weekly`: Random day and time each week
- `random`: Random within 1-24 hours

### supabaseClient.ts
Supabase client configuration for future backend integration.

**Status:** Placeholder - ready for implementation

**Future Features:**
- Fetch hadiths from cloud database
- User authentication
- Custom hadith submissions
- Sync settings across devices
- Analytics and tracking

## Usage Examples

```typescript
// Get a random hadith
import { getRandomHadith } from '../utils/hadithData';
const hadith = getRandomHadith();

// Schedule daily notifications
import { scheduleReflectionNotification } from '../utils/notification';
await scheduleReflectionNotification('daily');

// Initialize Supabase (when implemented)
import { supabase } from '../utils/supabaseClient';
const { data, error } = await supabase.from('hadiths').select('*');
```

## Adding More Hadiths

To add more hadiths to the collection:

1. Verify authenticity from reliable sources
2. Add to `hadithCollection` array in `hadithData.ts`
3. Include both English and Arabic text
4. Provide accurate reference and narrator
5. Categorize by theme

## Environment Variables

For Supabase setup, create a `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

