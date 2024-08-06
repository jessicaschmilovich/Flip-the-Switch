import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Notification messages based on moods
const notificationMessages = {
  happy: "You were happy most of the time this week. Keep shining and spreading those good vibes.",
  excited: "You were excited most of the time this week. Embrace the energy and enjoy every moment.",
  calm: "You were calm most of the time this week. Keep up the tranquil vibes and stay centered.",
  anxious: "You were anxious most of the time this week. Remember to breathe and stay grounded.",
  scared: "You were scared most of the time this week. Take a moment to ground yourself or talk to someone you trust.",
  angry: "You were angry most of the time this week. Try to channel your energy into something productive.",
  sad: "You were sad most of the time this week. Remember to be kind to yourself and reach out if you need support.",
  hopeless: "You were hopeless most of the time this week. It's crucial to seek support; you're not alone.",
  mixed: "You've experienced a mix of moods this week. Remember to take care of yourself and find balance.",
  noData: "Don't forget to select your daily mood to track your well-being! Your entries help us provide you with personalized insights and support."
};

// Get the most prevalent mood from the weekly data
const getMostPrevalentMood = async () => {
  const storedData = await AsyncStorage.getItem('weeklyData');
  if (!storedData) return 'noData';

  const weeklyData = JSON.parse(storedData);
  if (weeklyData.length === 0) return 'noData';

  const moodCount = weeklyData.reduce((acc, current) => {
    acc[current.mood] = (acc[current.mood] || 0) + 1;
    return acc;
  }, {});

  let prevalentMood = 'mixed';
  let maxCount = 0;

  for (const [mood, count] of Object.entries(moodCount)) {
    if (count > maxCount) {
      prevalentMood = mood;
      maxCount = count;
    } else if (count === maxCount) {
      prevalentMood = 'mixed';
    }
  }

  return prevalentMood;
};

// Schedule the weekly notification
const scheduleWeeklyNotification = async () => {
  const prevalentMood = await getMostPrevalentMood();
  const message = notificationMessages[prevalentMood];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Weekly Mood Summary",
      body: message,
    },
    trigger: {
      weekday: 7, // Sunday
      hour: 19, // 7 PM
      minute: 0,
      repeats: true,
    },
  });
};

// Register for push notifications
const registerForPushNotificationsAsync = async () => {
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
  } else {
    alert('Must use physical device for Push Notifications');
  }
};

// Notification prompt component
const NotificationPrompt = ({ visible, onClose }) => {
  const handleRegisterNotifications = async () => {
    await registerForPushNotificationsAsync();
    await AsyncStorage.setItem('notificationsEnabled', 'true');
    await scheduleWeeklyNotification();
    onClose();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('notificationsEnabled', 'false');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.header}>Welcome to Flip the Switch</Text>
          <Text style={styles.subHeader}>Would you like to receive notifications with more insight regarding your mood each week?</Text>
          <TouchableOpacity style={styles.button} onPress={handleRegisterNotifications}>
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004aad',
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    color: '#004aad',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#004aad',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: 'gray',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export { scheduleWeeklyNotification, registerForPushNotificationsAsync, NotificationPrompt };