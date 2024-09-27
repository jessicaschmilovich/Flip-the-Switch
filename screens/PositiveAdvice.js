import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, TouchableWithoutFeedback, Image } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { POSITIVE_ADVICE_API_KEY } from '@env';

const listenImage = require('../assets/Listen Icon.png');
const stopImage = require('../assets/Stop Icon.png');

// Custom header component that displays a back button and a reset button if needed
const CustomHeader = ({ navigation, showReset, onReset }) => {
  const handleReset = () => {
    Alert.alert(
      "Reset Advice",  // Title of the alert
      "Are you sure you want to delete all saved advice?",  // Message body
      [
        { text: "Cancel", style: "cancel" },  // Cancel option in the alert
        { text: "OK", onPress: onReset },  // OK option to confirm reset
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.customHeader}>
      {/* Back button to return to the previous screen */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      {/* Reset button appears only if showReset is true */}
      {showReset && (
        <TouchableOpacity onPress={handleReset} style={styles.headerResetButton}>
          <Ionicons name="trash" size={24} color="#004aad" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main component for entering a thought and retrieving positive advice
const PositiveAdviceMain = ({ navigation }) => {
  const [negativeThought, setNegativeThought] = useState('');  // Stores the user's input
  const [advice, setAdvice] = useState('');  // Stores the positive advice fetched from the API
  const [loading, setLoading] = useState(false);  // Indicates whether advice is being fetched
  const [voice, setVoice] = useState(null);  // Stores a specific voice for text-to-speech

  useEffect(() => {
    // Fetch available voices when the component mounts
    const fetchVoices = async () => {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      if (availableVoices.length >= 20) {
        setVoice(availableVoices[19]);  // Set the 20th voice
      }
    };

    fetchVoices();  // Trigger the voice fetching logic
  }, []);

  // Saves the fetched advice into AsyncStorage
  const saveAdvice = async (newAdvice) => {
    try {
      const savedAdvice = await AsyncStorage.getItem('previousAdvice');
      const adviceArray = savedAdvice ? JSON.parse(savedAdvice) : [];  // Parse saved advice or initialize empty
      adviceArray.unshift(newAdvice);  // Add new advice at the start
      await AsyncStorage.setItem('previousAdvice', JSON.stringify(adviceArray));  // Save the updated array
    } catch (error) {
      console.error('Error saving advice:', error.message);
    }
  };

  // Fetches positive advice from the OpenAI API based on user input
  const getPositiveAdvice = async () => {
    if (!negativeThought) return;  // Ensure there's input before proceeding
    setLoading(true);  // Show loading indicator
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',  // OpenAI API endpoint
        {
          model: 'gpt-3.5-turbo',  // Use this model
          messages: [
            {
              role: 'system',  // Instruction for how the AI should behave
              content: `Be helpful and provide concise, positive, unique, and specific advice. Keep responses short, meaningful, and no longer than 45 words, but they can be shorter. Always complete your sentences. If the user types anything about suicide or killing themselves, immediately respond by suggesting they call the Suicide & Crisis Lifeline at 988 for help.`,
            },
            {
              role: 'user',  // Input for the AI to respond to
              content: `Provide positive, specific advice for the following negative thought: ${negativeThought}. The response should be brief and to the point, with no more than 45 words.`,
            },
            
          ],
          temperature: 0.7,  // Set a balanced level of creativity
        },
        {
          headers: {
            'Authorization': `Bearer ${POSITIVE_ADVICE_API_KEY}`,  // Pass your API key
            'Content-Type': 'application/json',
          },
        }
      );
  
      // Extract and clean up the advice
      const newAdvice = response.data.choices[0].message.content.trim();
      setAdvice(newAdvice);  // Set the fetched advice into the state
      saveAdvice(newAdvice);  // Save the advice to AsyncStorage
    } catch (error) {
      console.error('Error fetching advice:', error.response ? error.response.data : error.message);
    }
  
    setLoading(false);  // Hide the loading indicator
  };  

  // Uses the Expo Speech module to read the advice aloud
  const speakAdvice = () => {
    if (advice) {
      Speech.speak(advice, { voice: voice?.identifier });  // Speak the advice with the selected voice
    }
  };

  // Stops the ongoing speech
  const stopAdvice = () => {
    Speech.stop();
  };

  // Resets the input and advice state
  const resetScreen = () => {
    setNegativeThought('');  // Clear the input field
    setAdvice('');  // Clear the advice
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Speech.stop();  // Stop speech when the screen loses focus
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Button to navigate to the screen that displays previous advice */}
      <TouchableOpacity onPress={() => navigation.navigate('PreviousAdvice')} style={styles.seePreviousButton}>
        <Text style={styles.seePreviousButtonText}>Past Advice</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Flip Your Perspective & Light Up Your Life Now</Text>
      {/* Input field for entering a negative thought */}
      <TextInput
        style={styles.input}
        placeholder="Enter your thought here"
        placeholderTextColor="#004aad"
        value={negativeThought}
        onChangeText={setNegativeThought}
      />
      {/* Button to trigger fetching of advice */}
      <TouchableOpacity onPress={getPositiveAdvice} style={styles.getAdviceButton}>
        <Text style={styles.getAdviceButtonText}>Get Advice</Text>
      </TouchableOpacity>
      {loading ? (
        <Text style={styles.loading}>Fetching advice...</Text>  // Display loading message while advice is being fetched
      ) : (
        advice && (  // Display advice if available
          <>
            <Text style={styles.advice}>{advice}</Text>
            <View style={styles.buttonWrapper}>
              {/* Button to start listening to the advice */}
              <TouchableOpacity onPress={speakAdvice} style={styles.centerButton}>
                <Image source={listenImage} style={styles.iconButton} />
              </TouchableOpacity>
              {/* Button to stop listening */}
              <TouchableOpacity onPress={stopAdvice} style={styles.centerButton}>
                <Image source={stopImage} style={styles.iconButton} />
              </TouchableOpacity>
            </View>
            {/* Button to reset the input and advice */}
            <TouchableOpacity onPress={resetScreen} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </>
        )
      )}
    </View>
  );
};

// Component for displaying the previously saved advice
const PreviousAdvice = ({ navigation }) => {
  const [previousAdvice, setPreviousAdvice] = useState([]);  // Stores previous advice

  useEffect(() => {
    const fetchPreviousAdvice = async () => {
      try {
        const savedAdvice = await AsyncStorage.getItem('previousAdvice');  // Fetch saved advice
        const adviceArray = savedAdvice ? JSON.parse(savedAdvice) : [];  // Parse or initialize empty array
        setPreviousAdvice(adviceArray);
      } catch (error) {
        console.error('Error fetching previous advice:', error.message);
      }
    };

    fetchPreviousAdvice();  // Trigger advice fetching on component mount
  }, []);

  // Handles resetting of saved advice by clearing AsyncStorage
  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem('previousAdvice');  // Clear AsyncStorage
      setPreviousAdvice([]);  // Update state to reflect deletion
    } catch (error) {
      console.error('Error resetting advice:', error.message);
    }
  };

  // Handles deletion of a specific advice entry
  const handleDelete = async (index) => {
    try {
      const updatedAdvice = [...previousAdvice];
      updatedAdvice.splice(index, 1);  // Remove advice at the specified index
      setPreviousAdvice(updatedAdvice);  // Update state
      await AsyncStorage.setItem('previousAdvice', JSON.stringify(updatedAdvice));  // Save updated advice
    } catch (error) {
      console.error('Error deleting advice:', error.message);
    }
  };

  const renderItem = ({ item, index }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity onPress={() => handleDelete(index)} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    >
      <TouchableWithoutFeedback onPress={() => navigation.navigate('FullAdvice', { advice: item })}>
        <View style={styles.adviceItem}>
          <Text style={styles.adviceSnippet}>{item.length > 60 ? `${item.substring(0, 60)}...` : item}</Text>
        </View>
      </TouchableWithoutFeedback>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#7bbbef' }}>
      <CustomHeader navigation={navigation} showReset={true} onReset={handleReset} />
      <FlatList
        data={previousAdvice}
        renderItem={renderItem}  // Render each advice item
        keyExtractor={(item, index) => index.toString()}  // Set unique key for each item
        contentContainerStyle={styles.listContainer}  // Style the list container
      />
    </GestureHandlerRootView>
  );
};

// Component to display the full advice text when an item is selected
const FullAdvice = ({ route, navigation }) => {
  const { advice } = route.params;  // Get full advice text from route params

  return (
    <View style={styles.container}>
      <CustomHeader navigation={navigation} showReset={false} />
      <Text style={styles.fullAdvice}>{advice}</Text>
    </View>
  );
};

// Stack Navigator for managing navigation within the app
const Stack = createStackNavigator();

const PositiveAdviceStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="PositiveAdviceMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#7bbbef',
          borderBottomColor: '#7bbbef',
          borderBottomWidth: 1,
        },
        headerTintColor: '#004aad',
        headerTitle: '',
      }}
    >
      <Stack.Screen
        name="PositiveAdviceMain"
        component={PositiveAdviceMain}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PreviousAdvice"
        component={PreviousAdvice}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FullAdvice"
        component={FullAdvice}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Main App component that wraps the stack navigator inside a NavigationContainer
const PositiveAdvice = () => {
  return (
    <NavigationContainer independent={true}>
      <PositiveAdviceStack />
    </NavigationContainer>
  );
};

// Styles for the Flip The Switch Positive Advice page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7bbbef',
    padding: 20,
    justifyContent: 'center',
  },
  customHeader: {
    backgroundColor: '#7bbbef',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#7bbbef',
    borderBottomWidth: 1,
  },
  headerBackButton: {
    left: 10,
  },
  headerResetButton: {
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
  seePreviousButton: {
    backgroundColor: 'transparent',
    marginBottom: 28,
    alignItems: 'center',
  },
  seePreviousButtonText: {
    color: '#007AFF',
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  getAdviceButton: {
    marginTop: 5,
    backgroundColor: '#004aad',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  getAdviceButtonText: {
    color: '#FFF',
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004aad',
    marginBottom: 20,
    textAlign: 'center',
    marginBottom: 25,
    marginTop: -5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#004aad',
    padding: 10,
    marginBottom: 20,
    borderRadius: 30,
    color: '#004aad',
  },
  loading: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  advice: {
    marginTop: 22,
    marginBottom: -10,
    fontSize: 17,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  iconButton: {
    width: 50,
    height: 50,
    marginTop: 2.5,
  },
  centerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: '#004aad',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 18,
  },
  listContainer: {
    padding: 20,
  },
  adviceItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceSnippet: {
    fontSize: 16,
    color: '#004aad',
  },
  fullAdvice: {
    fontSize: 20,
    color: '#004aad',
    textAlign: 'center',
    margin: 20,
  },
});

export default PositiveAdvice;