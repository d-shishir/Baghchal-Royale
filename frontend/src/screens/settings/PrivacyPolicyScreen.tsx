import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';

const PrivacyPolicyScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.bgGradStart, theme.colors.bgGradEnd]}
        style={styles.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
        
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          1. Introduction
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Welcome to Baghchal Royale. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          2. Data We Collect
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          As an offline-first application, we collect minimal data. Your game history and settings are stored locally on your device. We do not transmit your personal data to external servers.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          3. Contact Us
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          If you have any questions about this privacy policy, you can contact us at dshishir13@gmail.com.
        </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default PrivacyPolicyScreen;
