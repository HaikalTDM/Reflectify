import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications should be handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4af37',
    });
  }

  // Expo Go does not support push token APIs from SDK 53+
  if (Constants.appOwnership === 'expo') {
    // Still configure channels for local notifications, but skip token
    return undefined;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    // Skip on simulators/emulators
  }

  return token;
}

export async function scheduleReflectionNotification(
  frequency: 'manual' | 'daily' | 'weekly' | 'random'
): Promise<string | null> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (frequency === 'manual') {
    return null;
  }

  let trigger: Notifications.NotificationTriggerInput;

  switch (frequency) {
    case 'daily':
      // Schedule for a random time between 10 AM and 8 PM daily
      const hour = Math.floor(Math.random() * 10) + 10; // 10-19 (10 AM - 7 PM)
      const minute = Math.floor(Math.random() * 60);
      
      trigger = {
        hour,
        minute,
        repeats: true,
      };
      break;

    case 'weekly':
      // Schedule for a random day and time each week
      const weekday = Math.floor(Math.random() * 7) + 1; // 1-7 (Sunday-Saturday)
      const weekHour = Math.floor(Math.random() * 10) + 10;
      const weekMinute = Math.floor(Math.random() * 60);
      
      trigger = {
        weekday,
        hour: weekHour,
        minute: weekMinute,
        repeats: true,
      };
      break;

    case 'random':
      // Schedule for a random time in the next 24 hours
      const randomSeconds = Math.floor(Math.random() * 86400) + 3600; // 1-24 hours
      
      trigger = {
        seconds: randomSeconds,
        repeats: true,
      };
      break;

    default:
      return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Time for Reflection',
      body: 'Take a moment to reflect with a hadith',
      data: { screen: 'reflection' },
      sound: true,
    },
    trigger,
  });

  return notificationId;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

