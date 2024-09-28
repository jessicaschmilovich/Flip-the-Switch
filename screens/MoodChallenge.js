import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { MOOD_CHALLENGE_API_KEY } from '@env';

// Storing API key from the environment variables
const API_KEY2 = MOOD_CHALLENGE_API_KEY;

const MoodChallengeScreen = ({ navigation }) => {
  // States to store challenge details and status
  const [challengeTitle, setChallengeTitle] = useState('Use the Mood Tracker to Unlock a Challenge');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [challengeAvailable, setChallengeAvailable] = useState(false);

  useEffect(() => {
    // Function to load the challenge data
    const loadChallenge = async () => {
      try {
        const today = new Date().toDateString(); // Get today's date as a string
        const storedDate = await AsyncStorage.getItem('challengeDate'); // Fetch the stored date from AsyncStorage

        if (storedDate === today) { // If the stored challenge is from today, load it
          const storedMood = await AsyncStorage.getItem('selectedMood'); // Fetch the mood associated with the challenge
          const storedMoodChallenge = await AsyncStorage.getItem('MoodChallenge'); // Fetch the challenge details

          if (storedMood && storedMoodChallenge) {
            const [title, description] = storedMoodChallenge.split('\n'); // Split the challenge into title and description
            setChallengeTitle(title || 'Use the Mood Tracker to Unlock a Challenge'); // Set the challenge title
            setChallengeDescription(description || ''); // Set the challenge description
            const storedChecked = await AsyncStorage.getItem('challengeChecked'); // Check if the challenge was marked as completed
            setIsChecked(storedChecked === 'true'); // Set the state based on whether the challenge is completed
            setChallengeAvailable(true); // Mark challenge as available
          }
        } else {
          await resetChallenge(); // Reset the challenge if it's a new day
        }
      } catch (error) {
        console.error('Failed to load challenge:', error.message); // Log any errors that occur
      }
    };

    // Function to generate a new challenge and store it
    const generateAndStoreChallenge = async (mood) => {
      try {
        let validChallenge = false; // Boolean flag to validate the generated challenge
        let title = '';
        let description = '';

        // Continue generating new challenges until a valid one is obtained
        while (!validChallenge) {
          const newChallenge = await generateChallenge(mood); // Generate a challenge based on the current mood
          const [generatedTitle, generatedDescription] = newChallenge.split('\n'); // Split into title and description

          // Ensure the challenge is valid (title and description with a reasonable length)
          if (generatedTitle && generatedDescription && generatedDescription.split(' ').length <= 30) {
            title = generatedTitle; // Set title
            description = generatedDescription; // Set description
            validChallenge = true; // Mark the challenge as valid
          }
        }

        // Set the challenge in state
        setChallengeTitle(title);
        setChallengeDescription(description);
        setIsChecked(false); // Ensure the challenge is not checked as completed initially
        setChallengeAvailable(true); // Mark challenge as available

        const today = new Date().toDateString(); // Get today's date
        // Store the challenge and its date in AsyncStorage
        await AsyncStorage.setItem('MoodChallenge', `${title}\n${description}`);
        await AsyncStorage.setItem('challengeDate', today);
        await AsyncStorage.setItem('challengeChecked', 'false'); // Mark the challenge as not completed
      } catch (error) {
        console.error('Failed to generate and store challenge:', error.message); // Log any errors that occur
      }
    };

    // Function to reset the challenge data when a new day starts
    const resetChallenge = async () => {
      try {
        // Remove all relevant items from AsyncStorage to reset the challenge
        await AsyncStorage.removeItem('selectedMood');
        await AsyncStorage.removeItem('MoodChallenge');
        await AsyncStorage.removeItem('challengeDate');
        await AsyncStorage.removeItem('challengeChecked');
        // Reset the state to default values
        setChallengeTitle('Use the Mood Tracker to Unlock a Challenge');
        setChallengeDescription('');
        setChallengeAvailable(false); // Mark challenge as unavailable
      } catch (error) {
        console.error('Failed to reset challenge:', error.message); // Log any errors that occur
      }
    };

    // Function to check if the user's mood has changed and update the challenge accordingly
    const checkMoodChangeAndUpdate = async () => {
      try {
        const storedMood = await AsyncStorage.getItem('selectedMood'); // Get the current stored mood
        const currentMood = await AsyncStorage.getItem('currentMood'); // Get the last known mood

        if (storedMood !== currentMood) { // If the mood has changed, update it
          await AsyncStorage.setItem('currentMood', storedMood || ''); // Store the new mood
          if (storedMood) {
            await generateAndStoreChallenge(storedMood); // Generate a new challenge for the new mood
          }
        }
      } catch (error) {
        console.error('Failed to check mood change:', error.message); // Log any errors that occur
      }
    };

    loadChallenge(); // Load the challenge when the component mounts
    checkMoodChangeAndUpdate(); // Immediately check and update the challenge for the first mood selection
    const intervalId = setInterval(checkMoodChangeAndUpdate, 300); // Periodically check for mood changes

    // Listener to reload challenge data when the screen gains focus
    const focusListener = navigation.addListener('focus', loadChallenge);

    // Function to schedule resetting the challenge at midnight
    const scheduleMidnightReset = () => {
      const now = new Date(); // Get the current time
      const midnight = new Date(); // Set midnight time
      midnight.setHours(24, 0, 0, 0); // Set time to midnight

      const timeUntilMidnight = midnight.getTime() - now.getTime(); // Calculate time remaining until midnight

      setTimeout(async () => {
        await resetChallenge(); // Reset the challenge at midnight
        scheduleMidnightReset(); // Schedule the next midnight reset
      }, timeUntilMidnight); // Set the timeout for the reset
    };

    scheduleMidnightReset(); // Start scheduling the midnight resets

    return () => {
      clearInterval(intervalId); // Clear the interval when the component unmounts
      navigation.removeListener('focus', focusListener); // Remove the focus listener
    };
  }, [navigation]); // Dependencies: re-run the effect if navigation changes

  // Function to generate a new challenge using Open AI's API
  const generateChallenge = async (mood) => {
    try {
      // call to generate a challenge based on the user's mood
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Be creative. Generate a completely unique (never repeat or closely resemble previous suggestions) mood-specific challenge that helps someone improve their mood, uplift them, or maintain positive energy. Each challenge must include a title on the first line in bold, 22pt font, and in title case (capitalized). The description must follow on the next line in 20pt font, no more than 30 words, and not bolded. Avoid using emojis, and do not use the word "challenge" in the title. Ensure that the challenges are highly varied, incorporating a wide range of activities (physical, creative, social, reflective, or practical actions) to maintain novelty. While key terms like gratitude, art, collage, nature, sunshine, jukebox, fusion, or serenity can be used, limit their frequency to maintain creative diversity. Avoid relying on similar themes repeatedly, and ensure that each challenge offers fresh and unique approaches to fit the user's mood.`,
            },
            {
              role: 'user',
              content: `Generate an always unique challenge for someone feeling ${mood}. If the mood is negative (anxious, sad, angry, hopeless), the challenge should help uplift the user and improve their mood. If the mood is neutral, the challenge should aim to uplift the user to a more positive state. If the mood is positive (happy, excited, calm), the challenge should help maintain their positivity and encourage them to spread it to others. Avoid repetition of terms or themes across challenges to ensure variety and creativity.`,
            },
          ],
          max_tokens: 100, // Limit the number of tokens for the response
          temperature: 0.90, // Control the randomness of the generated response
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY2}`, // Provide the API key for authorization
            'Content-Type': 'application/json',
          },
        }
      );

      let result = response.data.choices[0].message.content.trim(); // Get the generated challenge content
      result = result.replace(/[*]/g, ''); // Remove any stray '*' characters
      return result; // Return the cleaned-up result
    } catch (error) {
      // In case of an error, provide a default challenge
      return 'Take a moment for self-care\nDo something small that makes you happy today.';
    }
  };

  // Function to handle the checkbox state (marking challenge as completed or not)
  const handleCheckboxChange = async (checked) => {
    setIsChecked(checked); // Update the checkbox state
    await AsyncStorage.setItem('challengeChecked', checked.toString()); // Store the state in AsyncStorage

    try {
      let completedChallenges = await AsyncStorage.getItem('completedChallenges'); // Fetch completed challenges
      completedChallenges = completedChallenges ? completedChallenges.split('\n\n') : [];

      const fullChallenge = `${challengeTitle}\n${challengeDescription}`; // Combine title and description
      if (checked) {
        if (!completedChallenges.includes(fullChallenge)) {
          completedChallenges.unshift(fullChallenge); // Add challenge to completed list
        }
      } else {
        completedChallenges = completedChallenges.filter(ch => ch !== fullChallenge); // Remove challenge if unchecked
      }

      await AsyncStorage.setItem('completedChallenges', completedChallenges.join('\n\n')); // Store updated list
    } catch (error) {
      console.error('Failed to update completed challenges:', error.message); // Log any errors
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainChallengeTitle}>{challengeTitle}</Text> 
      <Text style={styles.mainChallengeDescription}>{challengeDescription}</Text> 
      {challengeAvailable && ( // Render checkbox only if challenge is available
        <CustomCheckbox value={isChecked} onValueChange={handleCheckboxChange} /> 
      )}
      <TouchableOpacity
        style={styles.CompletedButton}
        onPress={() => navigation.navigate('CompletedChallenges')} 
      >
        <Text style={styles.CompletedButtonText}>Completed Challenges</Text> 
      </TouchableOpacity>
    </View>
  );
};

// Custom checkbox component to mark challenges as completed
const CustomCheckbox = ({ value, onValueChange }) => (
  <TouchableOpacity onPress={() => onValueChange(!value)} style={styles.checkboxContainer}> 
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <Ionicons name="checkmark" size={18} color="#fff" />} 
    </View>
    <Text style={styles.checkboxLabel}>{value ? "Completed" : "Mark as Completed"}</Text>
  </TouchableOpacity>
);

// Screen to display a list of completed challenges
const CompletedChallengesScreen = ({ navigation }) => {
  const [completedChallenges, setCompletedChallenges] = useState([]); // State to store completed challenges

  useEffect(() => {
    const fetchCompletedChallenges = async () => {
      try {
        const storedChallenges = await AsyncStorage.getItem('completedChallenges'); 
        if (storedChallenges) {
          setCompletedChallenges(storedChallenges.split('\n\n').filter(ch => ch.includes('\n'))); 
        }
      } catch (error) {
        console.error('Failed to load completed challenges:', error.message); 
      }
    };

    fetchCompletedChallenges(); // Fetch completed challenges when component mounts
  }, []);

  const renderItem = ({ item }) => ( 
    <TouchableOpacity onPress={() => navigation.navigate('FullChallenge', { challenge: item })}> 
      <View style={styles.challengeItem}> 
        <Text style={styles.completedChallengeTitle}>{item.split('\n')[0]}</Text> 
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" style={styles.headerBackButtonIcon} /> 
        </TouchableOpacity>
      </View>
      <FlatList
        data={completedChallenges}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()} 
        contentContainerStyle={styles.listContainer} 
      />
    </View>
  );
};

// Screen to display the full details of a selected challenge
const FullChallengeScreen = ({ route, navigation }) => {
  const { challenge } = route.params; // Get the selected challenge passed from the previous screen

  return (
    <View style={styles.container}>
      <View style={styles.fullChallengeHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.fullChallengeBackButton}> 
          <Ionicons name="arrow-back" style={styles.fullChallengeBackButtonIcon} /> 
        </TouchableOpacity>
      </View>
      <Text style={styles.fullChallengeTitle}>{challenge.split('\n')[0]}</Text> 
      <Text style={styles.fullChallengeDescription}>{challenge.split('\n')[1]}</Text> 
    </View>
  );
};

// Stack navigator for navigation between screens
const Stack = createStackNavigator();

const MoodChallenge = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator
        initialRouteName="MoodChallengeScreen"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#7bbbef',
          },
          headerTintColor: '#004aad',
          headerTitle: '',
        }}
      >
        <Stack.Screen
          name="MoodChallengeScreen"
          component={MoodChallengeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="CompletedChallenges"
          component={CompletedChallengesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="FullChallenge"
          component={FullChallengeScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles for Flip The Switch Mood Challenge page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7bbbef',
    padding: 20,
    justifyContent: 'center',
  },
  customHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    backgroundColor: '#7bbbef',
  },
  headerBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingRight: 10,
    marginTop: -41,
    marginLeft: -30,
  },
  headerBackButtonIcon: {
    fontSize: 24,
    color: '#004aad',
  },
  fullChallengeHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: '#7bbbef',
  },
  fullChallengeBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingRight: 10,
    marginTop: 5,
    marginLeft: -10,
  },
  fullChallengeBackButtonIcon: {
    fontSize: 24,
    color: '#004aad',
  },
  mainChallengeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#004aad',
  },
  mainChallengeDescription: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#004aad',
  },
  completedChallengeTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 0,
    color: '#004aad',
  },
  fullChallengeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#004aad',
  },
  fullChallengeDescription: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#004aad',
  },
  checkboxContainer: {
    flexDirection: 'center',
    alignItems: 'center',
    marginTop: 7.5,
    marginBottom: 5,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderWidth: 2,
    borderColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: -5,
    borderRadius: 5,
  },
  checkboxChecked: {
    backgroundColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 18,
    color: '#004aad',
    marginTop: 10,
    marginBottom: -2.5,
  },
  CompletedButton: {
    width: '100%',
    backgroundColor: '#004aad',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 0,
  },
  CompletedButtonText: {
    color: 'white',
    fontSize: 18,
  },
  listContainer: {
    padding: 25,
  },
  challengeItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    marginBottom: 30,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '111%',
    alignSelf: 'center',
  },
});

export default MoodChallenge;
