# Flip the Switch

Flip the Switch is a personalized mental well-being app designed to encourage positivity, build resilience, and help users manage their emotions through motivational quotes, positive advice, mood tracking, and adaptive mood-based challenges.

**Features:**
1. Daily Quotes

- Start your day with an uplifting message from a collection of over 400 hand-selected motivational quotes.

- A new quote is displayed every day to inspire and encourage positivity.

2. Positive Advice

- Share your thoughts and receive personalized, AI-driven advice tailored to your emotional needs.

- Anonymously express yourself without revealing your identity, ensuring a safe and supportive experience.

3. Mood Tracker

- Log your mood daily to gain insights into your emotional well-being.

- Users can choose to update their mood throughout the day if it changes.

- Helps users reflect and take proactive steps to improve their negative mood or continue feeling their positive mood.

4. Mood Challenges

- Receive a challenge utilizing AI tailored to the mood you log, designed to uplift or maintain your emotional state.

- Challenges adapt dynamically if your mood changes throughout the day, ensuring relevance and personalization.

- Users can mark challenges as completed for a sense of accomplishment.

5. Notifications

- Receive personalized weekly notifications summarizing your mood trends.

- Notifications provide motivational advice, reminders, and encouragement to keep you on track.

**Project Structure:**  
assets/  
Contains visual assets used for the app. Includes icons representing each feature (e.g., mood tracking, positive advice, mood challenges, and daily quotes) and additional icons used in Positive Advice (e.g., Listen and Stop).

navigation/  
BottomTabNavigator.js: Handles bottom tab navigation for switching between the app's main screens.

screens/  
Contains the app's core UI components, including:
- DailyQuote.js: Displays the daily motivational quote to the user.  
- MoodChallenge.js: Manages and displays mood-based challenges.  
- MoodTracker.js: Handles mood tracking functionality.  
- PositiveAdvice.js: Provides users with personalized positive advice based on their input.

services/  
notifications.js: Manages app notifications, including reminders and motivational updates.

App.js: The main entry point for the app that initializes and renders the primary components.

app.json: Configuration file for Expo, containing metadata and settings.

babel.config.js: Configuration file for Babel, used for transpiling JavaScript.

eas.json: Expo Application Services configuration file for builds and deployment.

package.json: Specifies project dependencies and npm scripts.

package-lock.json: Locks dependency versions for consistent builds.
