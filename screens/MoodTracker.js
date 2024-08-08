import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const moods = [
  { name: 'Happy', color: '#ffc000' },
  { name: 'Excited', color: '#ffb3c6' },
  { name: 'Calm', color: 'green' },
  { name: 'Neutral', color: '#a000c8' },
  { name: 'Anxious', color: '#ff7600' },
  { name: 'Angry', color: 'red' },
  { name: 'Sad', color: 'gray' },
  { name: 'Hopeless', color: '#333333' },
];

const HomeScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const storedData = await AsyncStorage.getItem('weeklyData');
      if (storedData) {
        setWeeklyData(JSON.parse(storedData));
      }
    };

    fetchWeeklyData();
  }, []);

  const handleMoodPress = async (mood) => {
    setSelectedMood(mood);
    const today = new Date();
    const localDateString = today.toLocaleDateString('en-CA'); // Use local date string in YYYY-MM-DD format
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    const newEntry = { day: dayOfWeek, date: localDateString, mood: mood.name, color: mood.color };

    let storedData = await AsyncStorage.getItem('weeklyData');
    storedData = storedData ? JSON.parse(storedData) : [];

    // Remove any existing entry of a previous mood for today
    storedData = storedData.filter(data => data.date !== localDateString);
    // Add the new mood for today
    storedData.push(newEntry);

    await AsyncStorage.setItem('weeklyData', JSON.stringify(storedData));
    setWeeklyData(storedData);

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

const ConfirmationScreen = ({ route, navigation }) => {
  const { mood } = route.params;

  return (
    <View style={styles.confirmationContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      <Text style={styles.confirmationText}>Mood Selected:</Text>
      <Text style={styles.selectedMoodText}>{mood.name}</Text>
    </View>
  );
};

const WeeklySummaryScreen = ({ navigation }) => {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const storedData = await AsyncStorage.getItem('weeklyData');
      if (storedData) {
        setWeeklyData(JSON.parse(storedData));
      }
    };

    fetchWeeklyData();
  }, []);

  const getSortedWeeklyData = (data) => {
    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const sortedWeeklyData = getSortedWeeklyData(weeklyData);

  return (
    <View style={styles.weeklySummaryContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      <Text style={styles.header}>Weekly Mood Summary</Text>
      {sortedWeeklyData.length === 0 ? (
        <Text style={styles.noDataText}>No data available</Text>
      ) : (
        <FlatList
          data={sortedWeeklyData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.moodItem}>
              <Text style={styles.dayText}>{item.day}:</Text>
              <View style={[styles.moodBox, { backgroundColor: item.color }]}>
                <Text style={styles.moodText}>{item.mood}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

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
  customHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  summaryButtonAbsolute: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  moodBox: {
    padding: 10,
    borderRadius: 30,
    alignItems: 'center', // Center the mood boxes
  },
  moodText: {
    color: '#fff',
    fontSize: 15.5, 
    fontWeight: 'bold',
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
  },
});

export default MoodTracker;