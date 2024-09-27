import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import { NotificationPrompt, scheduleWeeklyNotification } from './services/notifications';

export default function App() {
  // State to track whether the notification prompt should be shown
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Function to clear weekly data for MoodTracker if necessary
    const clearWeeklyDataIfNecessary = async () => {
      const now = new Date(); // Get current date
      const lastResetDate = await AsyncStorage.getItem('lastResetDate'); // Retrieve last reset date from storage
      const lastReset = lastResetDate ? new Date(lastResetDate) : null; // Convert last reset date to Date object

      // Calculate the most recent Monday
      const mostRecentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      mostRecentMonday.setHours(0, 0, 0, 0); // Set time to midnight

      // Reset if there hasn't been a reset since the most recent Monday
      if (!lastReset || lastReset < mostRecentMonday) {
        await AsyncStorage.removeItem('weeklyData'); // Clear weekly data if it's a new week
        await AsyncStorage.setItem('lastResetDate', mostRecentMonday.toISOString()); // Store the new reset date
      }
    };

    // Function to check if it's the user's first launch
    const checkFirstLaunch = async () => {
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled'); // Check if notifications are enabled
      if (notificationsEnabled === null) {
        setShowNotificationPrompt(true); // Show prompt if notifications haven't been set up
      } else if (notificationsEnabled === 'true') {
        await scheduleWeeklyNotification(); // Schedule notifications if they're enabled
      }
    };

    // Run the reset check and setup notifications at app start
    clearWeeklyDataIfNecessary(); // Check if weekly data needs to be cleared
    checkFirstLaunch(); // Check if this is the first app launch
  }, []);

  // Function to handle closing of the notification prompt
  const handleNotificationPromptClose = () => {
    setShowNotificationPrompt(false); // Hide the notification prompt
  };

  return (
    <View style={styles.container}>
      <BottomTabNavigator />
      <NotificationPrompt 
        visible={showNotificationPrompt}  // Pass the visibility state to NotificationPrompt
        onClose={handleNotificationPromptClose}  // Pass the close handler to NotificationPrompt
      />
    </View>
  );
}

// Styles for the main container
const styles = StyleSheet.create({
  container: {
    flex: 1,  // Set flex to fill the entire screen
  },
});