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
    if (!storedData) {
      return 'noData';
    }

    const weeklyData = JSON.parse(storedData);
    if (weeklyData.length === 0) {
      return 'noData';
    }

    const moodCount = weeklyData.reduce((acc, current) => {
      // Convert the mood to lowercase to match the keys in notificationMessages
      const mood = current.mood.toLowerCase();
      acc[mood] = (acc[mood] || 0) + 1;
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
  } catch (error) {
    return 'noData';
  }
};

// Schedule the weekly notification
export const scheduleWeeklyNotification = async () => {
  try {
    const prevalentMood = await getMostPrevalentMood();
    const message = notificationMessages[prevalentMood];

    const schedulingOptions = {
      content: {
        // This will display the correct notification message
        title: (prevalentMood === 'noData' || prevalentMood === 'NoData') ? 'No Data' : `Overall Mood This Week: ${prevalentMood.charAt(0).toUpperCase() + prevalentMood.slice(1)}`, // This will display the correct notification title
        body: message, 
      },
      trigger: {
        hour: 19, // 7 PM
        minute: 0,
        weekday: 1, // Sundays
        repeats: true,
      },
    };

    await Notifications.cancelAllScheduledNotificationsAsync(); // Cancel existing notifications to avoid duplicates
    await Notifications.scheduleNotificationAsync(schedulingOptions);

  } catch (error) {
    // Handle error silently or with a different mechanism
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

      await scheduleWeeklyNotification();
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }
  } catch (error) {
    // Handle error silently or with a different mechanism
  }
};

// Notification prompt component
export const NotificationPrompt = ({ visible, onClose }) => {
  const handleRegisterNotifications = async () => {
    await registerForPushNotificationsAsync();
    await AsyncStorage.setItem('notificationsEnabled', 'true');
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