import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateMeMutation } from '../services/api';
import { User, UserUpdate } from '../services/types';

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isVisible, onClose, user }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [country, setCountry] = useState(user.country || '');
  
  const [updateMe, { isLoading, isSuccess, error }] = useUpdateMeMutation();

  useEffect(() => {
    if (isSuccess) {
      Alert.alert('Success', 'Profile updated successfully.');
      onClose();
    }
    if (error && 'data' in error) {
      const errorData = error.data as { detail?: string };
      Alert.alert('Update Failed', errorData.detail || 'An unknown error occurred.');
    }
  }, [isSuccess, error, onClose]);

  const handleUpdate = () => {
    const updateData: UserUpdate = {};
    if (username !== user.username) updateData.username = username;
    if (email !== user.email) updateData.email = email;
    if (country !== (user.country || '')) updateData.country = country;

    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }
    
    updateMe(updateData);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient colors={['#2d2d2d', '#1a1a1a']} style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={30} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="globe-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Country (optional)"
                placeholderTextColor="#666"
                value={country}
                onChangeText={setCountry}
                editable={!isLoading}
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 5,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFF',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileModal; 