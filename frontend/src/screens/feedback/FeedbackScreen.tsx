import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useCreateFeedbackMutation, useCreateReportMutation } from '../../services/api';
import { RootState } from '../../store';
import { theme } from '../../theme';

type FormType = 'feedback' | 'bug_report';

const FeedbackScreen = () => {
  const [formType, setFormType] = useState<FormType>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { user } = useSelector((state: RootState) => state.auth);
  const [createFeedback, { isLoading: isSubmittingFeedback }] = useCreateFeedbackMutation();
  const [createReport, { isLoading: isSubmittingReport }] = useCreateReportMutation();

  const isLoading = isSubmittingFeedback || isSubmittingReport;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to submit feedback.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    try {
      if (formType === 'feedback') {
        await createFeedback({ user_id: user.user_id, subject, message }).unwrap();
      } else {
        await createReport({
          reporter_id: user.user_id,
          reported_user_id: user.user_id, // Reporting a bug against the system
          category: 'BUG',
          description: `Subject: ${subject}\n\n${message}`,
        }).unwrap();
      }
      Alert.alert("Success", "Your submission has been received. Thank you!");
      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert("Error", "There was an issue submitting your feedback. Please try again.");
    }
  };
  
  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit Feedback</Text>
          <Text style={styles.subtitle}>Help us improve Baghchal Royale!</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, formType === 'feedback' && styles.activeButton]}
            onPress={() => setFormType('feedback')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={formType === 'feedback' ? 'white' : '#999'} />
            <Text style={[styles.toggleText, formType === 'feedback' && styles.activeText]}>Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, formType === 'bug_report' && styles.activeButton]}
            onPress={() => setFormType('bug_report')}
          >
            <Ionicons name="bug-outline" size={20} color={formType === 'bug_report' ? 'white' : '#999'} />
            <Text style={[styles.toggleText, formType === 'bug_report' && styles.activeText]}>Bug Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
            <TextInput
                style={styles.input}
                placeholder="Subject"
                placeholderTextColor="#999"
                value={subject}
                onChangeText={setSubject}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={formType === 'feedback' ? "Share your thoughts..." : "Describe the bug in detail..."}
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
            />
        </View>

        <TouchableOpacity 
            style={[styles.submitButton, isLoading && {opacity: 0.6}]}
            onPress={handleSubmit}
            disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
      fontSize: 16,
      color: '#999',
      marginTop: 8
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 20,
    padding: 4
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    color: '#999',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeText: {
      color: 'white'
  },
  form: {
      marginBottom: 20
  },
  input: {
      backgroundColor: '#2C2C2C',
      color: 'white',
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      marginBottom: 15,
  },
  textArea: {
      height: 150,
      textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
  }
});

export default FeedbackScreen; 