import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../store';
import {
  toggleDarkMode,
  setEnableSoundEffects,
  setEnableVibration,
  setEnableAnimations,
} from '../../store/slices/uiSlice';
import { clearGameHistory } from '../../store/slices/gameSlice';
import { useAppTheme } from '../../theme';
import GameCard from '../../components/game/GameCard';
import { useAlert } from '../../contexts/AlertContext';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const uiState = useSelector((state: RootState) => state.ui);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const handleClearHistory = () => {
    showAlert({
      title: 'Clear Game History',
      message: 'Are you sure you want to clear all your local game history? This cannot be undone.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            dispatch(clearGameHistory());
            showAlert({
              title: 'Success',
              message: 'Game history cleared.',
              type: 'success',
            });
          },
        },
      ],
    });
  };

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  const handleToggleAnimations = (value: boolean) => {
    dispatch(setEnableAnimations(value));
  };

  const handleToggleSoundEffects = (value: boolean) => {
    dispatch(setEnableSoundEffects(value));
  };

  const handleToggleVibration = (value: boolean) => {
    dispatch(setEnableVibration(value));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.bgGradStart, theme.colors.bgGradEnd]}
        style={styles.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Display Settings */}
        <GameCard title="Display" icon={<Ionicons name="eye" size={24} color={theme.colors.primary} />} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Ionicons name="moon" size={24} color={theme.colors.primary} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Dark Mode</Text>
                <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {uiState.darkMode ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={uiState.darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Ionicons name="videocam" size={24} color={theme.colors.secondary} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Animations</Text>
                <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                   Enable heavy animations
                </Text>
              </View>
            </View>
            <Switch
              value={uiState.enableAnimations}
              onValueChange={handleToggleAnimations}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </GameCard>

        {/* Sound & Haptics */}
        <GameCard title="Sound & Haptics" icon={<Ionicons name="musical-notes" size={24} color={theme.colors.primary} />} style={styles.card}>
           <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Ionicons name="volume-high" size={24} color={theme.colors.tertiary} />
               <View style={styles.textContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Sound Effects</Text>
                <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                   Play game sounds
                </Text>
              </View>
            </View>
            <Switch
              value={uiState.enableSoundEffects}
              onValueChange={handleToggleSoundEffects}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
             <View style={styles.labelContainer}>
              <Ionicons name="phone-portrait" size={24} color={theme.colors.error} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Vibration</Text>
                <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                   Haptic feedback on moves
                </Text>
              </View>
            </View>
            <Switch
              value={uiState.enableVibration}
              onValueChange={handleToggleVibration}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </GameCard>

        {/* Game Data */}
        <GameCard title="Data" icon={<Ionicons name="save" size={24} color={theme.colors.primary} />} style={styles.card}>
           <View style={styles.row}>
             <View style={styles.labelContainer}>
              <Ionicons name="trash" size={24} color={theme.colors.error} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Clear History</Text>
                <Text style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
                   Delete all local game stats
                </Text>
              </View>
            </View>
            <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: theme.colors.error }]}
                onPress={handleClearHistory}
            >
                <Text style={styles.smallButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>
        </GameCard>
        
        <View style={styles.footer}>
            <Text style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>Version 1.0.0 (Offline)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
      // GameCard has its own styles but we can pass overrides here
      marginBottom: 20,
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
  },
  labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  textContainer: {
      marginLeft: 16,
      flex: 1,
  },
  label: {
      fontSize: 16,
      fontWeight: '600',
  },
  subLabel: {
      fontSize: 12,
      marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  smallButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
  },
  smallButtonText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 12,
  },
  footer: {
      padding: 20,
      alignItems: 'center',
  },
  version: {
      fontSize: 12,
      marginBottom: 4,
  },
});

export default SettingsScreen;
