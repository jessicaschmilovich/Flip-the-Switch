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
    // Retrieve stored weekly mood data from AsyncStorage
    const storedData = await AsyncStorage.getItem('weeklyData');
    
    // If no data is stored, return 'noData' as the default mood
    if (!storedData) {
      return 'noData';
    }

    // Parse the stored data from JSON format
    const weeklyData = JSON.parse(storedData);
    
    // If the parsed weekly data array is empty, return 'noData'
    if (weeklyData.length === 0) {
      return 'noData';
    }

    // Count the occurrences of each mood from the weekly data
    const moodCount = weeklyData.reduce((acc, current) => {
      // Convert the mood to lowercase to match the keys in notificationMessages
      const mood = current.mood.toLowerCase();
      
      // Increment the count for the mood or set it to 1 if it doesn't exist yet
      acc[mood] = (acc[mood] || 0) + 1;
      
      // Return the accumulator object containing mood counts
      return acc;
    }, {});

    // Initialize variables to track the most prevalent mood and the highest count
    let prevalentMood = 'mixed';  // Default mood if there's a tie or no clear winner
    let maxCount = 0;

    // Iterate over the mood counts to determine the most prevalent mood
    for (const [mood, count] of Object.entries(moodCount)) {
      // If the current mood count is greater than maxCount, update prevalentMood and maxCount
      if (count > maxCount) {
        prevalentMood = mood;
        maxCount = count;
      } else if (count === maxCount) {
        // If two moods have the same count, set the prevalentMood to 'mixed'
        prevalentMood = 'mixed';
      }
    }

    // Return the most prevalent mood, or 'mixed' if there was no clear winner
    return prevalentMood;
  } catch (error) {
    // In case of an error, return 'noData' to indicate that no mood data was found
    return 'noData';
  }
};

// Schedule the weekly notification
export const scheduleWeeklyNotification = async () => {
  try {
    // Get the most prevalent mood for the past week
    const prevalentMood = await getMostPrevalentMood();
    
    // Retrieve the corresponding notification message for the prevalent mood
    const message = notificationMessages[prevalentMood];

    // Retrieve all scheduled notifications to avoid duplication
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Check if the weekly notification for Sunday at 7 PM is already scheduled
    const isAlreadyScheduled = existingNotifications.some(
      (notification) =>
        notification.trigger?.repeats &&
        notification.trigger?.weekday === 1 &&
        notification.trigger?.hour === 19 &&
        notification.trigger?.minute === 0
    );

    // If the notification is already scheduled, exit the function to prevent duplication
    if (isAlreadyScheduled) {
      console.log("Weekly notification is already scheduled.");
      return;
    }

    // Define the scheduling options for the notification
    const schedulingOptions = {
      content: {
        // Set the notification title based on the prevalent mood
        title:
          prevalentMood === 'noData'
            ? 'No Data'
            : `Overall Mood This Week: ${prevalentMood.charAt(0).toUpperCase() + prevalentMood.slice(1)}`,
        
        // Set the notification body text to the appropriate mood message
        body: message,
      },
      trigger: {
        hour: 19, // Set the notification to trigger at 7 PM
        minute: 0, // On the hour
        weekday: 1, // Set the notification to trigger on Sundays (weekday: 1)
        repeats: true, // Ensure the notification repeats every week
      },
    };

    // Cancel any previously scheduled notifications for Sunday at 7 PM to avoid duplication
    for (let notification of existingNotifications) {
      if (notification.trigger?.weekday === 1 && notification.trigger?.hour === 19) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    // Schedule the new notification with the defined options
    await Notifications.scheduleNotificationAsync(schedulingOptions);
  } catch (error) {
    // Handle any errors that occur during scheduling (log silently or provide error feedback)
    console.error('Error scheduling weekly notification:', error);
  }
};

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  try {
    // Check if the device supports notifications (physical devices only)
    if (Device.isDevice) {
      // Get the current notification permissions status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      // Store the current permissions status
      let finalStatus = existingStatus;

      // If permissions are not granted, request permissions from the user
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permissions are still not granted, show an alert and exit the function
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }

      // If permissions are granted, schedule the weekly notification
      await scheduleWeeklyNotification();
    } else {
      // If using an emulator or simulator, notify the user that notifications are unavailable
      Alert.alert('Must use physical device for Push Notifications');
    }
  } catch (error) {
    // Handle any errors that occur during the registration process
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

// Styles for the Notification popup and buttons
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
