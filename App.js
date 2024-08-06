import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import { NotificationPrompt, scheduleWeeklyNotification } from './services/notifications';

export default function App() {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsEnabled === null) {
        setShowNotificationPrompt(true);
      } else if (notificationsEnabled === 'true') {
        await scheduleWeeklyNotification();
      }
    };

    checkFirstLaunch();
  }, []);

  const handleNotificationPromptClose = () => {
    setShowNotificationPrompt(false);
  };

  return (
    <View style={styles.container}>
      <BottomTabNavigator />
      <NotificationPrompt 
        visible={showNotificationPrompt} 
        onClose={handleNotificationPromptClose} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
