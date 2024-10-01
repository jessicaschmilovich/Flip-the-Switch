import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getISOWeek } from 'date-fns';

// Array of available moods, each with a name and a color
const moods = [
  { name: 'happy', color: '#ffc000' },
  { name: 'excited', color: '#fc97b1' },
  { name: 'calm', color: 'green' },
  { name: 'neutral', color: '#a000c8' },
  { name: 'anxious', color: '#ff7600' },
  { name: 'angry', color: 'red' },
  { name: 'sad', color: 'gray' },
  { name: 'hopeless', color: '#333333' },
];

// Mapping of mood names to corresponding emoji images
const moodEmojis = {
  happy: require('../assets/Happy Emoji.png'),
  excited: require('../assets/Excited Emoji.png'),
  calm: require('../assets/Calm Emoji.png'),
  neutral: require('../assets/Neutral Emoji.png'),
  anxious: require('../assets/Anxious Emoji.png'),
  angry: require('../assets/Angry Emoji.png'),
  sad: require('../assets/Sad Emoji.png'),
  hopeless: require('../assets/Hopeless Emoji.png'),
};

// Function to check if weekly data needs to be reset based on the current week number
const clearWeeklyDataIfNecessary = async () => {
  const now = new Date();
  const currentWeekNumber = getISOWeek(now); // Get the current ISO week number
  const lastResetWeekNumber = await AsyncStorage.getItem('lastResetWeekNumber');

  if (lastResetWeekNumber !== String(currentWeekNumber)) {
    // Reset weekly data if we're in a new week
    await AsyncStorage.removeItem('weeklyData');
    await AsyncStorage.setItem('lastResetWeekNumber', String(currentWeekNumber));
    return true; // Reset occurred
  }

  return false; // No reset needed
};

// Home screen where users select their mood
const HomeScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null); // State to track selected mood
  const [weeklyData, setWeeklyData] = useState([]); // State to store weekly mood data

  useEffect(() => {
    const loadInitialData = async () => {
      const resetOccurred = await clearWeeklyDataIfNecessary();

      if (resetOccurred) {
        setWeeklyData([]); // Reset the weekly data if necessary
      } else {
        // Load existing weekly data if no reset
        const storedWeeklyData = await AsyncStorage.getItem('weeklyData');
        if (storedWeeklyData) {
          setWeeklyData(JSON.parse(storedWeeklyData));
        }
      }

      // Load the last selected mood from AsyncStorage
      const storedMood = await AsyncStorage.getItem('selectedMood');
      if (storedMood) {
        const mood = moods.find(m => m.name === storedMood); // Find mood by name
        setSelectedMood(mood);
      }
    };

    loadInitialData();
  }, []);

  // Function to handle when a mood is pressed
  const handleMoodPress = async (mood) => {
    setSelectedMood(mood); // Set the selected mood in state
    await AsyncStorage.setItem('selectedMood', mood.name); // Store the selected mood

    const today = new Date();
    const localDateString = today.toLocaleDateString('en-CA'); // Store the date in YYYY-MM-DD format
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Create a new entry for today
    const newEntry = { day: dayOfWeek, date: localDateString, mood: mood.name, color: mood.color };

    // Update the weekly data, removing any old entry for today
    let updatedWeeklyData = [...weeklyData];
    updatedWeeklyData = updatedWeeklyData.filter(data => data.date !== localDateString);
    updatedWeeklyData.push(newEntry);

    // Save updated data and navigate to confirmation screen
    await AsyncStorage.setItem('weeklyData', JSON.stringify(updatedWeeklyData));
    setWeeklyData(updatedWeeklyData);
    navigation.navigate('Confirmation', { mood });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Your Mood Today</Text>
      <View style={styles.moodContainer}>
        {moods.map((mood, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.moodButton, { backgroundColor: mood.color }]}
            onPress={() => handleMoodPress(mood)}
          >
            <Text style={styles.moodText}>{mood.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.summaryButton}
        onPress={() => navigation.navigate('WeeklySummary')}
      >
        <Text style={styles.summaryButtonText}>Weekly Mood Summary</Text>
      </TouchableOpacity>
    </View>
  );
};

// Confirmation screen showing the selected mood
const ConfirmationScreen = ({ route, navigation }) => {
  const { mood } = route.params; // Get the passed mood from route params

  return (
    <View style={styles.confirmationContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      {moodEmojis[mood.name] && (
        <Image source={moodEmojis[mood.name]} style={styles.emojiImage} />
      )}
      <Text style={styles.confirmationText}>Mood Selected:</Text>
      <Text style={styles.selectedMoodText}>{mood.name}</Text>
    </View>
  );
};

const WeeklySummaryScreen = ({ navigation }) => {
  const [weeklyData, setWeeklyData] = useState([]); // State to store weekly data for the current week

  useEffect(() => {
    // Fetch weekly data from AsyncStorage on component mount
    const fetchWeeklyData = async () => {
      const storedData = await AsyncStorage.getItem('weeklyData'); // Retrieve weekly data from local storage
      if (storedData) {
        setWeeklyData(JSON.parse(storedData)); // Parse and set the weekly data if it exists
      }
    };

    fetchWeeklyData(); // Call the function to load the data
  }, []); // Empty dependency array ensures this only runs on component mount

  // Function to sort the weekly data by date in ascending order
  const getSortedWeeklyData = (data) => {
    return data.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort based on the date field
  };

  const sortedWeeklyData = getSortedWeeklyData(weeklyData); // Store sorted data for rendering

  return (
    <View style={styles.weeklySummaryContainer}>
      {/* Back button to navigate to the previous screen */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      
      {/* Header text for the weekly summary */}
      <Text style={styles.header}>Weekly Mood Summary</Text>
      
      {/* If no mood data is available, show a message; otherwise, render the mood entries */}
      {sortedWeeklyData.length === 0 ? (
        <Text style={styles.noDataText}>Track moods to view them here!</Text>
      ) : (
        // Rendering mood entries for the current week
        <View>
          {sortedWeeklyData.map((item, index) => (
            <View key={index} style={styles.moodItem}>
              {/* Displaying the day of the week */}
              <Text style={styles.dayText}>{item.day}:</Text>
              {/* Displaying the mood and associated color */}
              <View style={[styles.moodBox, { backgroundColor: item.color }]}>
                <Text style={styles.moodText}>{item.mood}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Stack Navigator for navigation structure
const Stack = createStackNavigator();

const MoodTracker = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles for Flip The Switch Mood Tracker page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7bbbef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  weeklySummaryContainer: {
    flex: 1,
    backgroundColor: '#7bbbef',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#004aad',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  moodButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  summaryButton: {
    width: '100%',
    backgroundColor: '#004aad',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 26,
  },
  summaryButtonText: {
    color: 'white',
    fontSize: 18,
  },
  confirmationContainer: {
    flex: 1,
    backgroundColor: '#7bbbef',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiImage: {
    width: 245,
    height: 245,
    marginBottom: 0,
    marginTop: -60,
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    alignItems: 'center',
  },
  selectedMoodText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#004aad',
    alignItems: 'center',
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 18.5,
    fontWeight: 'bold',
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  moodBox: {
    paddingHorizontal: 10,
    paddingVertical: 0.5,
    borderRadius: 30,
  },
  moodText: {
    color: '#fff',
    fontSize: 15.89,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  headerBackButton: {
    position: 'absolute',
    top: 15,
    left: 10,
    zIndex: 1,
  },
  noDataText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    color: '#004aad',
  },
});

export default MoodTracker;
