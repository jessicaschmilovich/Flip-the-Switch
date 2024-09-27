import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import DailyQuote from '../screens/DailyQuote';
import PositiveAdvice from '../screens/PositiveAdvice';
import MoodTracker from '../screens/MoodTracker';
import MoodChallenge from '../screens/MoodChallenge';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Daily Quote"
        screenOptions={({ route }) => ({
          tabBarButton: (props) => (
            <Pressable
              {...props}
              style={({ pressed }) => [
                props.style,
                pressed && styles.tabButtonPressed,
              ]}
            />
          ),
          tabBarIcon: ({ focused }) => {
            let icon;
            switch (route.name) {
              case 'Quote of the Day':
                icon = require('../assets/daily quote icon.png');
                break;
              case 'Positive Advice':
                icon = require('../assets/positive advice icon.png');
                break;
              case 'Mood Tracker':
                icon = require('../assets/mood tracker icon.png');
                break;
              case 'Mood Challenge':
                icon = require('../assets/mood challenge icon.png');
                break;
              default:
                icon = null;
            }
            return <Image source={icon} style={styles.tabIcon} />;
          },
          tabBarLabel: () => null, // No labels
          tabBarStyle: {
            height: 80,
            borderTopWidth: 0.85, // Set border width for tab bar
            borderTopColor: '#004aad', // Set the color for tab bar
            backgroundColor: '#7bbbef', // Set tab bar background color
          },
          tabBarItemStyle: {
            paddingTop: 10,
          },
          headerStyle: {
            backgroundColor: '#7bbbef', // Set header background color
            borderBottomColor: '#004aad', // Set border color for below tab titles
            borderBottomWidth: 0.85, // Set border width for below tab titles
          },
          headerTintColor: '#004aad', // Set header text color if needed
        })}
      >
        <Tab.Screen 
          name="Quote of the Day" 
          component={DailyQuote} 
          options={{
            headerTitle: 'Quote of the Day',
          }}
        />
        <Tab.Screen 
          name="Positive Advice" 
          component={PositiveAdvice} 
          options={{
            headerTitle: 'Positive Advice',
          }}
        />
        <Tab.Screen 
          name="Mood Tracker" 
          component={MoodTracker} 
          options={{
            headerTitle: 'Mood Tracker',
          }}
        />
        <Tab.Screen 
          name="Mood Challenge" 
          component={MoodChallenge} 
          options={{
            headerTitle: 'Mood Challenge',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabButtonPressed: {
    opacity: 0.7, // Darker shade when pressed
  },
  tabIcon: {
    width: 64, 
    height: 64,
    resizeMode: 'contain',
  },
});

export default BottomTabNavigator;