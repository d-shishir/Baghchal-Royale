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
import { useUpdateProfileMutation } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  country?: string;
}

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    bio?: string;
    country?: string;
  }>({});

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setCountry(user.country || '');
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    if (bio && bio.length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
    }

    if (country && country.length > 50) {
      newErrors.country = 'Country must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updates: any = {};
      
      if (username !== user?.username) {
        updates.username = username.trim();
      }
      if (bio !== (user?.bio || '')) {
        updates.bio = bio.trim();
      }
      if (country !== (user?.country || '')) {
        updates.country = country.trim();
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('No Changes', 'No changes were made to your profile.');
        onClose();
        return;
      }

      const result = await updateProfile(updates).unwrap();
      
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.data?.detail || error.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleClose = () => {
    // Reset form to original values
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setCountry(user.country || '');
    }
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modal}>
            <LinearGradient colors={['#333', '#404040']} style={styles.modalGradient}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity 
                  onPress={handleSave} 
                  style={[styles.saveButton, isLoading && styles.disabledButton]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FF6F00" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Username Field */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>
                    Username <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (errors.username) {
                          setErrors({ ...errors, username: undefined });
                        }
                      }}
                      placeholder="Enter username"
                      placeholderTextColor="#666"
                      autoCapitalize="none"
                      maxLength={30}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                {/* Bio Field */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Bio</Text>
                  <View style={[styles.inputContainer, styles.bioContainer, errors.bio && styles.inputError]}>
                    <Ionicons name="document-text-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, styles.bioInput]}
                      value={bio}
                      onChangeText={(text) => {
                        setBio(text);
                        if (errors.bio) {
                          setErrors({ ...errors, bio: undefined });
                        }
                      }}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="#666"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.charCount}>
                    <Text style={styles.charCountText}>{bio.length}/200</Text>
                  </View>
                  {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
                </View>

                {/* Country Field */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Country</Text>
                  <View style={[styles.inputContainer, errors.country && styles.inputError]}>
                    <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={country}
                      onChangeText={(text) => {
                        setCountry(text);
                        if (errors.country) {
                          setErrors({ ...errors, country: undefined });
                        }
                      }}
                      placeholder="Enter your country"
                      placeholderTextColor="#666"
                      maxLength={50}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
                </View>

                {/* Info Text */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
                  <Text style={styles.infoText}>
                    Your email cannot be changed. Contact support if you need to update it.
                  </Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalGradient: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6F00',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  required: {
    color: '#FF6F00',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#555',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  bioContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 0,
  },
  bioInput: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default EditProfileModal; 