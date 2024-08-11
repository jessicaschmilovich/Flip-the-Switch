import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { MOOD_CHALLENGE_API_KEY } from '@env';

const API_KEY2 = MOOD_CHALLENGE_API_KEY;

const MoodChallengeScreen = ({ navigation }) => {
  const [challengeTitle, setChallengeTitle] = useState('Use the Mood Tracker to Unlock a Challenge');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [challengeAvailable, setChallengeAvailable] = useState(false);

  useEffect(() => {
    const loadChallenge = async () => {
      const storedMood = await AsyncStorage.getItem('selectedMood');
      const today = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem('challengeDate');
      const storedMoodChallenge = await AsyncStorage.getItem('MoodChallenge');

      if (storedMood && storedDate === today && storedMoodChallenge) {
        const [title, description] = storedMoodChallenge.split('\n');
        setChallengeTitle(title);
        setChallengeDescription(description);
        const storedChecked = await AsyncStorage.getItem('challengeChecked');
        setIsChecked(storedChecked === 'true');
        setChallengeAvailable(true);
      } else {
        await generateAndStoreChallenge(storedMood);
      }
    };

    const generateAndStoreChallenge = async (mood) => {
      let validChallenge = false;
      let title = '';
      let description = '';

      while (!validChallenge) {
        const newChallenge = await generateChallenge(mood);
        const [generatedTitle, generatedDescription] = newChallenge.split('\n');

        if (generatedTitle && generatedDescription && generatedDescription.split(' ').length <= 30) {
          title = generatedTitle;
          description = generatedDescription;
          validChallenge = true;
        }
      }

      setChallengeTitle(title);
      setChallengeDescription(description);
      setIsChecked(false);  // Reset the checkbox to unchecked when a new challenge is generated
      setChallengeAvailable(true);

      const today = new Date().toDateString();
      await AsyncStorage.setItem('MoodChallenge', `${title}\n${description}`);
      await AsyncStorage.setItem('challengeDate', today);
      await AsyncStorage.setItem('challengeChecked', 'false');  // Reset the stored checked state
    };

    const checkMoodChangeAndUpdate = async () => {
      const storedMood = await AsyncStorage.getItem('selectedMood');
      const currentMood = await AsyncStorage.getItem('currentMood');

      if (storedMood !== currentMood) {
        await AsyncStorage.setItem('currentMood', storedMood);
        await generateAndStoreChallenge(storedMood);
      }
    };

    loadChallenge();
    const intervalId = setInterval(checkMoodChangeAndUpdate, 1000); // Check every second

    const focusListener = navigation.addListener('focus', loadChallenge);

    return () => {
      clearInterval(intervalId);
      navigation.removeListener('focus', focusListener);
    };
  }, [navigation]);

  const generateChallenge = async (mood) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a creative assistant. Generate a unique, mood-specific challenge that is designed to either help someone improve their mood if they are feeling negative, uplift them if they are feeling neutral, or maintain and spread positivity if they are feeling positive. Each challenge should include a title on the first line that is bold, 22 pt font, and in title case (capitalized). The description should follow on the next line in 20pt font, not bolded. The challenge must always include both a title and a description, with the description being no more than 30 words. Avoid using emojis. Generate a new challenge each time based on the user's current mood.`,
            },
            {
              role: 'user',
              content: `Generate a unique challenge for someone feeling ${mood}. If the mood is negative (anxious, sad, angry, hopeless), the challenge should focus on activities that help cheer up the user and improve their mood. If the mood is neutral, the challenge should aim to uplift the user to a more positive state. If the mood is positive (happy, excited, calm), the challenge should help maintain their positivity and encourage them to positively impact others. Ensure the challenge is different every time the mood changes.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY2}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      let result = response.data.choices[0].message.content.trim();
      result = result.replace(/[*]/g, ''); // Remove any * characters
      return result;
    } catch (error) {
      return 'Take a moment for self-care\nDo something small that makes you happy today.';
    }
  };  

  const handleCheckboxChange = async (checked) => {
    setIsChecked(checked);
    await AsyncStorage.setItem('challengeChecked', checked.toString());

    try {
      let completedChallenges = await AsyncStorage.getItem('completedChallenges');
      completedChallenges = completedChallenges ? completedChallenges.split('\n\n') : [];

      const fullChallenge = `${challengeTitle}\n${challengeDescription}`;
      if (checked) {
        if (!completedChallenges.includes(fullChallenge)) {
          completedChallenges.unshift(fullChallenge);
        }
      } else {
        completedChallenges = completedChallenges.filter(ch => ch !== fullChallenge);
      }

      await AsyncStorage.setItem('completedChallenges', completedChallenges.join('\n\n'));
    } catch (error) {
      console.error('Failed to update completed challenges:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainChallengeTitle}>{challengeTitle}</Text>
      <Text style={styles.mainChallengeDescription}>{challengeDescription}</Text>
      {challengeAvailable && (
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

const CustomCheckbox = ({ value, onValueChange }) => (
  <TouchableOpacity onPress={() => onValueChange(!value)} style={styles.checkboxContainer}>
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <Ionicons name="checkmark" size={18} color="#fff" />}
    </View>
    <Text style={styles.checkboxLabel}>{value ? "Completed" : "Mark as Completed"}</Text>
  </TouchableOpacity>
);

const CompletedChallengesScreen = ({ navigation }) => {
  const [completedChallenges, setCompletedChallenges] = useState([]);

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

    fetchCompletedChallenges();
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

const FullChallengeScreen = ({ route, navigation }) => {
  const { challenge } = route.params;

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
    marginTop: -10,
    borderRadius: 5,
  },
  checkboxChecked: {
    backgroundColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#004aad',
    marginTop: 10,
    marginBottom: -5,
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