import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import QRScanner from './src/screens/QRScanner';
import Vigilancia from './src/screens/Vigilancia';

const Stack = createStackNavigator();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="QRScanner" screenOptions={{
      headerStyle: {
        backgroundColor: '#00aff8',
      },
      headerTintColor: '#00aff8',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen name="QRScanner" component={QRScanner} />
      <Stack.Screen name="Vigilancia" component={Vigilancia} />

      {/* <Stack.Screen name="Location" component={LocationScreen} /> */}



    </Stack.Navigator>
  </NavigationContainer>
);

export default App;
