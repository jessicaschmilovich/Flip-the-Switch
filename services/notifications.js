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

// Function to get the most prevalent mood from weekly data stored in AsyncStorage
const getMostPrevalentMood = async () => {
  try {
    // Retrieve weekly mood data from AsyncStorage
    const storedData = await AsyncStorage.getItem('weeklyData');
    
    // If no data is stored, return 'noData' as a fallback
    if (!storedData) {
      return 'noData';
    }

    // Parse the retrieved data from JSON format
    const weeklyData = JSON.parse(storedData);
    
    // Return 'noData' if the weekly data array is empty
    if (weeklyData.length === 0) {
      return 'noData';
    }

    // Count occurrences of each mood in the weekly data
    const moodCount = weeklyData.reduce((acc, current) => {
      const mood = current.mood.toLowerCase();
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});

    let prevalentMood = 'mixed';  // Default mood if the data doesn't show a clear trend
    let maxCount = 0;

    // Determine the most prevalent mood by iterating over the mood counts
    for (const [mood, count] of Object.entries(moodCount)) {
      if (count > maxCount) {
        prevalentMood = mood;
        maxCount = count;
      } else if (count === maxCount) {
        prevalentMood = 'mixed';  // Handle ties by setting the mood to 'mixed'
      }
    }

    return prevalentMood;
  } catch (error) {
    // Return 'noData' in case of an error (e.g., if data retrieval fails)
    return 'noData';
  }
};

// Function to schedule a weekly notification on Sunday at 7 PM
export const scheduleWeeklyNotification = async () => {
  try {
    // Retrieve the most prevalent mood for the week
    const prevalentMood = await getMostPrevalentMood();
    const message = notificationMessages[prevalentMood];  // Get the corresponding message for the prevalent mood

    // Get all scheduled notifications
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();

    // Check if a notification is already scheduled for Sunday at 7 PM
    const isSundayNotificationScheduled = existingNotifications.some(
      (notification) =>
        notification.trigger?.repeats &&
        notification.trigger?.weekday === 1 &&  // Sunday
        notification.trigger?.hour === 19 &&    // 7 PM
        notification.trigger?.minute === 0
    );

    // If a notification is already scheduled for Sunday at 7 PM, do nothing
    if (isSundayNotificationScheduled) {
      console.log("Sunday notification at 7 PM is already scheduled.");
      return;
    }

    // Schedule a new weekly notification for Sunday at 7 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: prevalentMood === 'noData' 
          ? 'No Data' 
          : `Overall Mood This Week: ${prevalentMood.charAt(0).toUpperCase() + prevalentMood.slice(1)}`,
        body: message,  // Notification body with the message based on mood
      },
      trigger: {
        hour: 19, // 7 PM
        minute: 0, // On the hour
        weekday: 1, // Sunday
        repeats: true, // Ensures the notification repeats weekly
      },
    });

    console.log("Weekly notification scheduled for Sunday at 7 PM.");
  } catch (error) {
    console.error('Error scheduling weekly notification:', error);  // Log any errors that occur during scheduling
  }
};

// Function to register the device for push notifications
export const registerForPushNotificationsAsync = async () => {
  try {
    // Check if the app is running on a physical device
    if (Device.isDevice) {
      // Get the current notification permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If permission is not granted, request it from the user
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If the user denies permission, show an alert and return
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }

      // If permission is granted, schedule the weekly notification
      await scheduleWeeklyNotification();
    } else {
      // If running on a simulator/emulator, show a warning that notifications don't work on simulators
      Alert.alert('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.error('Error registering for notifications:', error);  // Log any errors that occur during the registration process
  }
};

// Component to show a modal prompting the user to enable notifications
export const NotificationPrompt = ({ visible, onClose }) => {
  // Handle enabling notifications when the user opts to enable them
  const handleRegisterNotifications = async () => {
    await registerForPushNotificationsAsync();  // Register for push notifications
    await AsyncStorage.setItem('notificationsEnabled', 'true');  // Store the notification preference
    onClose();  // Close the modal
  };

  // Handle skipping the notifications setup
  const handleSkip = async () => {
    await AsyncStorage.setItem('notificationsEnabled', 'false');  // Store the user's choice to skip notifications
    onClose();  // Close the modal
  };

  // Render the pop up with options to enable or skip notifications
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}  // Handle pop up close action
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
