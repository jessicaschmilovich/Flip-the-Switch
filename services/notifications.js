import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Notification messages based on moods
const notificationMessages = {
  happy: "Keep shining and spreading those good vibes.",
  excited: "Embrace the energy and enjoy every moment.",
  calm: "Keep up the tranquil vibes and stay centered.",
  neutral: "Try adding a little something new to your routine to spark some positivity.",
  anxious: "Remember to breathe and stay grounded.",
  angry: "Take a moment to pause and find a constructive way to release that energy.",
  sad: "Remember to be kind to yourself and reach out if you need support.",
  hopeless: "It's crucial to seek support from mental health professionals; you're not alone.",
  mixed: "It's okay to feel a range of emotions. Embrace the mix and stay mindful.",
  noData: "Don't forget to select your daily mood to track your well-being! Your entries help provide you with personalized insights and support."
};

// Get the most prevalent mood from the weekly data
const getMostPrevalentMood = async () => {
  try {
    const storedData = await AsyncStorage.getItem('weeklyData');
    
    // If no data is stored, return 'noData' as the default mood
    if (!storedData) {
      return 'noData';
    }

    const weeklyData = JSON.parse(storedData);
    
    // If the parsed weekly data array is empty, return 'noData'
    if (weeklyData.length === 0) {
      return 'noData';
    }

    // Count the occurrences of each mood from the weekly data
    const moodCount = weeklyData.reduce((acc, current) => {
      const mood = current.mood.toLowerCase();
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});

    let prevalentMood = 'mixed';  // Mood in cases where no clear emotional trend emerges
    let maxCount = 0;

    // Iterate over the mood counts to determine the most prevalent mood
    for (const [mood, count] of Object.entries(moodCount)) {
      if (count > maxCount) {
        prevalentMood = mood;
        maxCount = count;
      } else if (count === maxCount) {
        prevalentMood = 'mixed';
      }
    }

    return prevalentMood;
  } catch (error) {
    return 'noData';
  }
};

// Schedule the weekly notification on Sunday at 7 PM
export const scheduleWeeklyNotification = async () => {
  try {
    const prevalentMood = await getMostPrevalentMood();
    const message = notificationMessages[prevalentMood];

    // Retrieve all scheduled notifications
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();

    // Check if there are any notifications already scheduled for Sunday at 7 PM
    const isSundayNotificationScheduled = existingNotifications.some(
      (notification) =>
        notification.trigger?.repeats &&
        notification.trigger?.weekday === 1 &&
        notification.trigger?.hour === 19 &&
        notification.trigger?.minute === 0
    );

    // If the notification for Sunday at 7 PM is already scheduled, exit
    if (isSundayNotificationScheduled) {
      console.log("Sunday notification at 7 PM is already scheduled.");
      return;
    }

    // Schedule a new notification for Sunday at 7 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: prevalentMood === 'noData' 
          ? 'No Data' 
          : `Overall Mood This Week: ${prevalentMood.charAt(0).toUpperCase() + prevalentMood.slice(1)}`,
        body: message,
      },
      trigger: {
        hour: 19,        // 7 PM
        minute: 0,       // 0 minutes past the hour
        weekday: 1,      // Sunday
        repeats: true,   // Repeats weekly
      },
    });

    console.log("Weekly notification scheduled for Sunday at 7 PM.");
  } catch (error) {
    console.error('Error scheduling weekly notification:', error);
  }
};

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }

      // If permissions are granted, schedule the weekly notification
      await scheduleWeeklyNotification();
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.error('Error registering for notifications:', error);
  }
};

// Notification prompt component
export const NotificationPrompt = ({ visible, onClose }) => {
  // Handle enabling notifications when the user chooses to enable them
  const handleRegisterNotifications = async () => {
    // Register the device for push notifications
    await registerForPushNotificationsAsync();
    
    // Store a flag indicating that notifications are enabled
    await AsyncStorage.setItem('notificationsEnabled', 'true');
    
    // Close the modal prompt
    onClose();
  };

  // Handle skipping the notifications setup
  const handleSkip = async () => {
    // Store a flag indicating that notifications are disabled
    await AsyncStorage.setItem('notificationsEnabled', 'false');
    
    // Close the modal prompt
    onClose();
  };

  // Return the modal component with buttons to enable or skip notifications
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.header}>Welcome to{'\n'}Flip the Switch</Text>
          <Text style={styles.subHeader}>Would you like to receive weekly notifications with more insight regarding your mood?</Text>
          <TouchableOpacity style={styles.button} onPress={handleRegisterNotifications}>
            <Text style={styles.buttonText}>Enable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Styles for the Notification pop up and buttons
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
