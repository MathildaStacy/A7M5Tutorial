import React from 'react';
import {StatusBar} from 'react-native';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {BookOpen, Camera, Aperture, MessageCircle, UserRound} from 'lucide-react-native';
import {CameraTab} from './src/ui/CameraTab';
import {LearnTab} from './src/ui/LearnTab';
import {LabTab} from './src/ui/LabTab';
import {CoachTab} from './src/ui/CoachTab';
import {SettingsTab} from './src/ui/SettingsTab';
import {color, font} from './src/ui/theme';
import type {Routes} from './src/ui/routes';
const Tab = createBottomTabNavigator<Routes>();
const icons = {
  学习: BookOpen,
  相机: Camera,
  实验室: Aperture,
  'AI 教练': MessageCircle,
  我的: UserRound,
};
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1, backgroundColor: color.bg}}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: color.bg,
              card: color.bg,
              border: color.line,
              text: color.ink,
              primary: color.accent,
            },
          }}
        >
          <Tab.Navigator
            screenOptions={({route}) => ({
              headerShown: false,
              tabBarActiveTintColor: color.accent,
              tabBarInactiveTintColor: color.muted,
              tabBarStyle: {backgroundColor: color.bg, borderTopColor: color.line},
              tabBarLabelStyle: {fontFamily: font.body, fontSize: 11},
              tabBarHideOnKeyboard: true,
              tabBarIcon: ({color: tint, size}) => {
                const Icon = icons[route.name];
                return <Icon color={tint} size={size - 2} />;
              },
            })}
          >
            <Tab.Screen name="学习" component={LearnTab} />
            <Tab.Screen name="相机" component={CameraTab} />
            <Tab.Screen name="实验室" component={LabTab} />
            <Tab.Screen name="AI 教练" component={CoachTab} />
            <Tab.Screen name="我的" component={SettingsTab} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
