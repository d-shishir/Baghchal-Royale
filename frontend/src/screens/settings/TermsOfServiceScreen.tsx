import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';

const TermsOfServiceScreen: React.FC = () => {
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Terms of Service</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
         <Text style={[styles.text, { color: theme.colors.text }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          1. Agreement to Terms
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          2. Intellectual Property
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          The Service and its original content, features, and functionality are and will remain the exclusive property of valid owners.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          3. Termination
        </Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          4. Governing Law
        </Text>
         <Text style={[styles.text, { color: theme.colors.text }]}>
          These Terms shall be governed and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions.
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

export default TermsOfServiceScreen;
