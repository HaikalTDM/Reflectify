import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { enableSync, disableSync, syncLocalToCloud, syncCloudToLocal } from '../utils/userStatsSupabase';

export default function ProfileScreen() {
  const [isDark, setIsDark] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const { user, isAnonymous, signOut } = useAuth();
  const { showToast, showAlert } = useNotification();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const dark = await AsyncStorage.getItem('darkMode');
    setIsDark(dark === 'true');
    
    const sync = await AsyncStorage.getItem('sync_enabled');
    setSyncEnabled(sync === 'true');
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleToggleSync = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!user) {
      showAlert({
        title: 'Sign In Required',
        message: 'You need to sign in to enable cloud sync.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') },
        ],
      });
      return;
    }

    if (syncEnabled) {
      // Disable sync
      await disableSync();
      setSyncEnabled(false);
      showToast('Cloud sync disabled');
    } else {
      // Enable sync and upload data
      showAlert({
        title: 'Enable Cloud Sync?',
        message: 'Your local progress will be uploaded to the cloud. This will overwrite any existing cloud data.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: async () => {
              setSyncing(true);
              await enableSync();
              setSyncEnabled(true);
              setSyncing(false);
              showToast('✅ Cloud sync enabled & data uploaded');
            }
          },
        ],
      });
    }
  };

  const handleUploadToCloud = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showAlert({
      title: 'Upload Local Data?',
      message: 'This will upload your local progress to the cloud, overwriting cloud data.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upload', 
          onPress: async () => {
            setSyncing(true);
            const result = await syncLocalToCloud();
            setSyncing(false);
            
            if (result.success) {
              showToast('✅ Data uploaded to cloud');
            } else {
              showAlert({
                title: 'Upload Failed',
                message: result.error || 'Failed to upload data',
                buttons: [{ text: 'OK' }],
              });
            }
          }
        },
      ],
    });
  };

  const handleDownloadFromCloud = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showAlert({
      title: 'Download Cloud Data?',
      message: 'This will replace your local progress with cloud data.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: async () => {
            setSyncing(true);
            const result = await syncCloudToLocal();
            setSyncing(false);
            
            if (result.success) {
              showToast('✅ Data downloaded from cloud');
            } else {
              showAlert({
                title: 'Download Failed',
                message: result.error || 'Failed to download data',
                buttons: [{ text: 'OK' }],
              });
            }
          }
        },
      ],
    });
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showAlert({
      title: 'Sign Out?',
      message: 'Your local data will remain on this device.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            showToast('Signed out');
            router.replace('/');
          }
        },
      ],
    });
  };

  const handleCreateAccount = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={28} color="#d4af37" />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
          Account & Sync
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Account Info */}
        <View className={`rounded-3xl p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-primary-accent/20 items-center justify-center mr-4">
              <Ionicons 
                name={isAnonymous ? 'person-circle' : 'person'} 
                size={32} 
                color="#d4af37" 
              />
            </View>
            <View className="flex-1">
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                {isAnonymous ? 'Anonymous User' : user?.email || 'Not signed in'}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAnonymous ? 'Data stored locally only' : 'Cloud sync available'}
              </Text>
            </View>
          </View>

          {isAnonymous && (
            <TouchableOpacity
              onPress={handleCreateAccount}
              className="bg-primary-accent rounded-xl py-3 items-center"
            >
              <Text className="text-primary-dark font-bold">Create Account & Sync Data</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cloud Sync Toggle */}
        {!isAnonymous && (
          <View className={`rounded-3xl p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="cloud" size={28} color="#d4af37" />
                <View className="ml-4 flex-1">
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    Cloud Sync
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {syncEnabled ? 'Auto-sync enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleToggleSync}
                disabled={syncing}
                className={`w-14 h-8 rounded-full justify-center ${
                  syncEnabled ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full bg-white ${
                    syncEnabled ? 'ml-7' : 'ml-1'
                  }`}
                />
              </TouchableOpacity>
            </View>
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Automatically sync your progress across all devices
            </Text>
          </View>
        )}

        {/* Manual Sync Options */}
        {!isAnonymous && syncEnabled && (
          <View className="mb-6">
            <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              MANUAL SYNC
            </Text>
            
            <TouchableOpacity
              onPress={handleUploadToCloud}
              disabled={syncing}
              className={`rounded-2xl p-5 mb-3 flex-row items-center justify-between ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="cloud-upload" size={24} color="#d4af37" />
                <View className="ml-4 flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    Upload to Cloud
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Replace cloud data with local
                  </Text>
                </View>
              </View>
              {syncing ? (
                <ActivityIndicator color="#d4af37" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#d4af37" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownloadFromCloud}
              disabled={syncing}
              className={`rounded-2xl p-5 flex-row items-center justify-between ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="cloud-download" size={24} color="#d4af37" />
                <View className="ml-4 flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    Download from Cloud
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Replace local data with cloud
                  </Text>
                </View>
              </View>
              {syncing ? (
                <ActivityIndicator color="#d4af37" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#d4af37" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out */}
        {!isAnonymous && (
          <TouchableOpacity
            onPress={handleSignOut}
            className={`rounded-2xl p-5 mb-6 flex-row items-center justify-center border-2 ${
              isDark ? 'border-red-900/30 bg-red-900/10' : 'border-red-200 bg-red-50'
            }`}
          >
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text className="text-red-500 font-bold ml-3">Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

