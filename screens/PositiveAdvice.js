import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

// Custom header component with a reset button for PreviousAdvice
const CustomHeader = ({ navigation, showReset, onReset }) => {
  const handleReset = () => {
    Alert.alert(
      "Reset Advice",
      "Are you sure you want to delete all saved advice?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: onReset },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.customHeader}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
      </TouchableOpacity>
      {showReset && (
        <TouchableOpacity onPress={handleReset} style={styles.headerResetButton}>
          <Ionicons name="trash" size={24} color="#004aad" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main component for entering thoughts and getting advice
const PositiveAdviceMain = ({ navigation }) => {
  const [negativeThought, setNegativeThought] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState(null);

  useEffect(() => {
    const fetchVoices = async () => {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      if (availableVoices.length >= 20) {
        setVoice(availableVoices[19]); // Set to the 20th voice
      }
    };

    fetchVoices();
  }, []);

  const saveAdvice = async (newAdvice) => {
    try {
      const savedAdvice = await AsyncStorage.getItem('previousAdvice');
      const adviceArray = savedAdvice ? JSON.parse(savedAdvice) : [];
      adviceArray.unshift(newAdvice);
      await AsyncStorage.setItem('previousAdvice', JSON.stringify(adviceArray));
    } catch (error) {
      console.error('Error saving advice:', error.message);
    }
  };

  const getPositiveAdvice = async () => {
    if (!negativeThought) return;
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Provide concise and specific positive advice in response to user input, with no more than 26 words. If suggesting a helpline, specify the type (e.g., abuse helpline, suicide helpline, etc.).',
            },
            {
              role: 'user',
              content: `Give positive and specific advice for the following negative thought: "${negativeThought}"`,
            },
          ],
          max_tokens: 50,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const newAdvice = response.data.choices[0].message.content.trim();
      setAdvice(newAdvice);
      saveAdvice(newAdvice);
    } catch (error) {
      console.error('Error fetching advice:', error.response ? error.response.data : error.message);
    }
    setLoading(false);
  };

  const speakAdvice = () => {
    if (advice) {
      Speech.speak(advice, { voice: voice?.identifier });
    }
  };

  const stopAdvice = () => {
    Speech.stop();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('PreviousAdvice')} style={styles.seePreviousButton}>
        <Text style={styles.seePreviousButtonText}>Past Advice</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Flip Your Perspective & Light Up Your Life Now</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your thought here"
        placeholderTextColor="#004aad"
        value={negativeThought}
        onChangeText={setNegativeThought}
      />
      <TouchableOpacity onPress={getPositiveAdvice} style={styles.getAdviceButton}>
        <Text style={styles.getAdviceButtonText}>Get Advice</Text>
      </TouchableOpacity>
      {loading ? (
        <Text style={styles.loading}>Fetching advice...</Text>
      ) : (
        advice && (
          <>
            <Text style={styles.advice}>{advice}</Text>
            <TouchableOpacity onPress={speakAdvice} style={styles.playButton}>
              <Text style={styles.playButtonText}>Listen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopAdvice} style={styles.stopButton}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )
      )}
    </View>
  );
};

// Component for displaying previous advice
const PreviousAdvice = ({ navigation }) => {
  const [previousAdvice, setPreviousAdvice] = useState([]);

  useEffect(() => {
    const fetchPreviousAdvice = async () => {
      try {
        const savedAdvice = await AsyncStorage.getItem('previousAdvice');
        const adviceArray = savedAdvice ? JSON.parse(savedAdvice) : [];
        setPreviousAdvice(adviceArray);
      } catch (error) {
        console.error('Error fetching previous advice:', error.message);
      }
    };

    fetchPreviousAdvice();
  }, []);

  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem('previousAdvice');
      setPreviousAdvice([]); // Update state to reflect deletion
    } catch (error) {
      console.error('Error resetting advice:', error.message);
    }
  };

  const handleDelete = async (index) => {
    try {
      const updatedAdvice = [...previousAdvice];
      updatedAdvice.splice(index, 1);
      setPreviousAdvice(updatedAdvice);
      await AsyncStorage.setItem('previousAdvice', JSON.stringify(updatedAdvice));
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
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </GestureHandlerRootView>
  );
};

// Component for displaying full advice
const FullAdvice = ({ route, navigation }) => {
  const { advice } = route.params;

  return (
    <View style={styles.container}>
      <CustomHeader navigation={navigation} showReset={false} />
      <Text style={styles.fullAdvice}>{advice}</Text>
    </View>
  );
};

// Stack Navigator for PositiveAdvice
const Stack = createStackNavigator();

const PositiveAdviceStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="PositiveAdviceMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#7bbbef', // Set the background color of the header
          borderBottomColor: '#7bbbef', // Set the color of the bottom border
          borderBottomWidth: 1, // Set the width of the bottom border if necessary
        },
        headerTintColor: '#004aad', // Set the color of the back arrow
        headerTitle: '', // No title
      }}
    >
      <Stack.Screen
        name="PositiveAdviceMain"
        component={PositiveAdviceMain}
        options={{ headerShown: false }} // Hide the header for this screen
      />
      <Stack.Screen
        name="PreviousAdvice"
        component={PreviousAdvice}
        options={{ headerShown: false }} // Hide the header for this screen
      />
      <Stack.Screen
        name="FullAdvice"
        component={FullAdvice}
        options={{ headerShown: false }} // Hide the header for this screen
      />
    </Stack.Navigator>
  );
};

// Main App Component
const PositiveAdvice = () => {
  return (
    <NavigationContainer independent={true}>
      <PositiveAdviceStack />
    </NavigationContainer>
  );
};

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
    borderBottomColor: '#7bbbef', // Set the bottom border color
    borderBottomWidth: 1, // Set the bottom border width
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
    backgroundColor: 'transparent', // Default button background color
    marginBottom: 28,
    marginTop: 'center', // Adjust marginTop to move the button up and down
    alignItems: 'center',
  },
  seePreviousButtonText: {
    color: '#007AFF', // Default blue color for buttons in iOS
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  getAdviceButton: {
    marginTop: 5,
    backgroundColor: '#004aad', // Button color
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  getAdviceButtonText: {
    color: '#FFF', // Match Previous Advice button text color
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004aad',
    marginBottom: 20,
    textAlign: 'center',
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
    fontSize: 17,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playButton: {
    marginTop: 17,
    backgroundColor: 'transparent', // Button color
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#007AFF',
    fontSize: 18,
    textDecorationLine: 'underline', // Underline the text
  },
  stopButton: {
    marginTop: 0.5,
    backgroundColor: 'transparent', // Button color
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#007AFF',
    fontSize: 18,
    textDecorationLine: 'underline', // Underline the text
  },
  listContainer: {
    padding: 20,
  },
  adviceItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    marginBottom: 10,
  },
  adviceSnippet: {
    fontSize: 16,
    color: '#004aad',
  },
  fullAdvice: {
    fontSize: 18,
    color: '#004aad',
    textAlign: 'center',
    margin: 20,
  },
});

export default PositiveAdvice;