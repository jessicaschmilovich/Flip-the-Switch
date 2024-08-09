import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const challenges = [
  "Compliment a stranger – Find something nice to say to someone you don't know",
  "Hold the door open – Be the one to hold the door for others throughout the day",
  "Send a thank you note – Write a heartfelt thank you message to someone who has helped you recently",
  "Donate old clothes – Gather clothes you no longer wear and donate them to a local shelter",
  "Pay for someone’s coffee – Surprise the person behind you in line by paying for their coffee",
  "Leave a positive review – Write a glowing review for a small business you love",
  "Pick up litter – Spend a few minutes picking up trash in your neighborhood or local park",
  "Compliment a parent – Tell one of your parents something you really appreciate about them",
  "Share a motivational quote – Send an uplifting quote to someone who might need it",
  "Help with groceries – Offer to help someone carry their groceries to their car",
  "Donate to a cause – Find a charity or cause you care about and make a small donation",
  "Write a positive note – Leave a note with a kind message on someone’s desk or locker",
  "Feed the birds – Set out birdseed or bread crumbs in a park",
  "Offer your seat – Give up your seat to someone who might need it more, like the elderly or pregnant women",
  "Volunteer your time – Offer a few hours of your time to a local community service",
  "Compliment a friend – Tell a friend something you genuinely admire about them",
  "Share your umbrella – Offer your umbrella to someone caught in the rain",
  "Donate books – Give away books you’ve already read to a local library or school",
  "Smile at five strangers – Make an effort to smile at people you pass by today",
  "Help a neighbor – Offer to do something helpful for a neighbor, like bringing in their trash bins",
  "Give a genuine compliment online – Write a kind comment on someone’s social media post",
  "Cook a meal for someone – Prepare a meal and share it with a friend or neighbor",
  "Write a letter to a friend – Send a handwritten letter to reconnect with an old friend",
  "Offer to babysit – Volunteer to babysit for someone who might need a break",
  "Buy local – Support a local business by making a purchase",
  "Leave a surprise gift – Leave a small gift for someone to find",
  "Say “thank you” more often – Be extra mindful of saying thank you for everything, big or small",
  "Help someone study – Offer to help a friend or sibling with their studies",
  "Donate to a food bank – Drop off some non-perishable food items at a local food bank",
  "Share a recipe – Send a favorite recipe to someone who loves to cook",
  "Leave a book in a public place – Leave a good book in a public area with a note saying “Free to a good home”",
  "Help someone with technology – Offer to help someone who struggles with technology",
  "Plant a tree – Contribute to the environment by planting a tree or some flowers",
  "Give someone a flower – Hand someone a flower, just because",
  "Send a care package – Put together a small care package for someone who might need a pick-me-up",
  "Give someone your full attention – Listen intently without interrupting or checking your phone",
  "Bake cookies for a neighbor – Share homemade cookies with someone living nearby",
  "Help someone move – Offer your help to someone who is moving",
  "Send an encouraging text – Text someone who might need encouragement",
  "Leave a tip – If you’re eating out, leave a generous tip",
  "Offer a ride – Give someone a ride who might need it",
  "Donate pet supplies – Drop off pet food or supplies at a local animal shelter",
  "Be kind to yourself – Take a moment to do something nice for yourself",
  "Help with chores – Offer to help someone with household chores",
  "Support a crowdfunding cause – Donate to a friend’s or stranger’s crowdfunding campaign",
  "Help a friend achieve a goal – Offer to help someone with their personal goal",
  "Send flowers to someone special – Brighten someone’s day with a bouquet of flowers",
  "Share an inspirational story – Tell someone an inspiring story you’ve heard or read",
  "Give away your seat in a waiting area – Offer your seat to someone who may need it more",
  "Volunteer at an animal shelter – Spend some time helping animals in need",
  "Send a surprise gift – Send an unexpected gift to a friend or family member",
  "Make someone laugh – Share a funny story or joke with someone to lighten their mood",
  "Help someone find a job – Offer to help with resume building or job searching",
  "Write a poem for someone – Write and share a kind poem with a friend",
  "Send a card to someone in the hospital – Brighten a patient’s day with a kind card",
  "Donate school supplies – Provide school supplies to a student or teacher in need",
  "Mentor someone – Offer to mentor someone younger or less experienced",
  "Create a positivity jar – Start a jar filled with positive notes or affirmations for someone",
  "Give someone a book you think they’d love – Share a book that had a positive impact on you",
  "Buy a stranger lunch – Pay for someone’s lunch or coffee",
  "Be kind to animals – Spend time volunteering at an animal shelter or simply be extra kind to pets",
  "Help someone carry their bags – Offer assistance to someone struggling with their belongings",
  "Share your knowledge – Teach someone a skill or share knowledge you have",
  "Start a gratitude list – Help someone start a list of things they’re grateful for",
  "Give someone a break – Offer to take over a task so someone can have a break",
  "Do a chore without being asked – Complete a household task without being prompted",
  "Help someone reach their goal – Offer support or motivation to help someone achieve a personal goal",
  "Buy a gift for someone “just because” – Surprise someone with a thoughtful gift without a special occasion",
  "Help an elderly person – Assist an elderly person with shopping, yard work, or other tasks",
  "Bring snacks to school – Share a snack or treat with your classmates",
  "Be kind on social media – Make a positive comment or share something uplifting online",
  "Send an uplifting song – Share a song that makes you feel good with a friend",
  "Surprise someone with breakfast – Prepare or buy breakfast for a friend or family member",
  "Bring a reusable bag – Offer your reusable bag to someone at the grocery store who forgot theirs",
  "Say “I love you” – Tell someone close to you how much you care",
  "Help someone with a project – Offer to assist someone with a project they’re working on",
  "Send a surprise text – Send a random text to brighten someone’s day",
  "Start a chain of kindness – Do something kind for someone and ask them to pay it forward",
  "Leave a positive note in a public place – Leave an encouraging note on a bulletin board or at a café",
  "Help a friend organize their space – Offer to help clean or organize a friend’s room or workspace",
  "Send a funny meme – Brighten someone’s day with a funny meme",
  "Invite someone for a walk – Spend time outdoors with a friend or family member",
  "Offer to tutor someone – Help a peer or younger student with their studies",
  "Buy extra food and donate it – Purchase extra food during your grocery run and donate it to a shelter",
  "Say something positive to yourself – Practice self-kindness by saying something nice to yourself",
  "Bring flowers to school – Brighten up your classroom with fresh flowers",
  "Help a friend move – Offer to help a friend with packing or moving",
  "Offer to water someone’s plants – Help a neighbor or friend by watering their plants",
  "Write a positive post-it note – Leave a positive note on someone’s desk or mirror",
  "Bring coffee or tea for someone – Surprise someone with their favorite coffee or tea",
  "Help someone clean their car – Offer to help a friend or neighbor wash their car",
  "Offer to run an errand – Help someone by running an errand for them",
  "Donate to a charity you love – Make a small donation to a cause that’s important to you",
  "Support a friend’s creative work – Share or promote a friend’s art, writing, or other creative work",
  "Be patient with others – Practice patience in your interactions throughout the day",
  "Encourage someone – Give a word of encouragement to someone facing a challenge",
  "Leave an anonymous gift – Leave a small gift or treat anonymously for someone to find",
  "Share an interesting article – Send a thoughtful or inspiring article to someone",
  "Help someone with a DIY project – Offer to assist someone with a home improvement or craft project",
  "Donate toys to a children’s charity – Find gently used or new toys to donate to a children’s charity"
];

const CustomHeader = ({ navigation }) => (
  <View style={styles.customHeader}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
      <Ionicons name="arrow-back" size={24} color="#004aad" />
    </TouchableOpacity>
  </View>
);

const CustomCheckbox = ({ value, onValueChange }) => (
  <TouchableOpacity onPress={() => onValueChange(!value)} style={styles.checkboxContainer}>
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <Ionicons name="checkmark" size={18} color="#fff" />}
    </View>
    <Text style={styles.checkboxLabel}>{value ? "Completed" : "Mark as Completed"}</Text>
  </TouchableOpacity>
);

const DailyChallengeMain = ({ navigation }) => {
  const [challenge, setChallenge] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const storedChallenge = await AsyncStorage.getItem('dailyChallenge');
        const storedDate = await AsyncStorage.getItem('challengeDate');
        const storedChecked = await AsyncStorage.getItem('challengeChecked');
        const today = new Date().toDateString();

        if (storedChallenge && storedDate === today) {
          setChallenge(storedChallenge);
          setIsChecked(storedChecked === 'true');
        } else {
          const newChallenge = challenges[Math.floor(Math.random() * challenges.length)];
          setChallenge(newChallenge);
          setIsChecked(false);
          await AsyncStorage.setItem('dailyChallenge', newChallenge);
          await AsyncStorage.setItem('challengeDate', today);
          await AsyncStorage.setItem('challengeChecked', 'false');
        }
      } catch (error) {
        console.error('Failed to load the challenge:', error.message);
        setChallenge('');
        setIsChecked(false);
      }
    };

    loadChallenge();

    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadChallenge();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleCheckboxChange = async (checked) => {
    setIsChecked(checked);
    await AsyncStorage.setItem('challengeChecked', checked.toString());

    try {
      let completedChallenges = await AsyncStorage.getItem('completedChallenges');
      completedChallenges = completedChallenges ? completedChallenges.split('\n') : [];

      if (checked) {
        if (!completedChallenges.includes(challenge)) {
          completedChallenges.unshift(challenge);
        }
      } else {
        completedChallenges = completedChallenges.filter(ch => ch !== challenge);
      }

      await AsyncStorage.setItem('completedChallenges', completedChallenges.join('\n'));
    } catch (error) {
      console.error('Failed to update completed challenges:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainChallengeTitle}>{challenge.split(' – ')[0]}</Text>
      <Text style={styles.mainChallengeDescription}>{challenge.split(' – ')[1]}</Text>
      <CustomCheckbox value={isChecked} onValueChange={handleCheckboxChange} />
      <TouchableOpacity
        style={styles.CompletedButton}
        onPress={() => navigation.navigate('CompletedChallenges')}
      >
        <Text style={styles.CompletedButtonText}>Completed Challenges</Text>
      </TouchableOpacity>
    </View>
  );
};

const CompletedChallenges = ({ navigation }) => {
  const [completedChallenges, setCompletedChallenges] = useState([]);

  useEffect(() => {
    const fetchCompletedChallenges = async () => {
      try {
        const storedChallenges = await AsyncStorage.getItem('completedChallenges');
        if (storedChallenges) {
          setCompletedChallenges(storedChallenges.split('\n'));
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
        <Text style={styles.completedChallengeTitle}>{item.split(' – ')[0]}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader navigation={navigation} />
      <FlatList
        data={completedChallenges}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const FullChallenge = ({ route, navigation }) => {
  const { challenge } = route.params;

  return (
    <View style={styles.container}>
      <CustomHeader navigation={navigation} />
      <Text style={styles.fullChallengeTitle}>{challenge.split(' – ')[0]}</Text>
      <Text style={styles.fullChallengeDescription}>{challenge.split(' – ')[1]}</Text>
    </View>
  );
};

const Stack = createStackNavigator();

const DailyChallenge = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator
        initialRouteName="DailyChallengeMain"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#7bbbef',
          },
          headerTintColor: '#004aad',
          headerTitle: '',
        }}
      >
        <Stack.Screen
          name="DailyChallengeMain"
          component={DailyChallengeMain}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompletedChallenges"
          component={CompletedChallenges}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FullChallenge"
          component={FullChallenge}
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
    backgroundColor: '#7bbbef',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    position: 'absolute',
    top: -5,
    left: -10,
    zIndex: 1,
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
  },
  CompletedButton: {
    width: '100%',
    backgroundColor: '#004aad',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 26,
  },
  CompletedButtonText: {
    color: 'white',
    fontSize: 18,
  },
  listContainer: {
    padding: 20,
  },
  challengeItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
    marginTop: -20,
  },
});

export default DailyChallenge;