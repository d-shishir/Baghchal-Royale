import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Constants from 'expo-constants';
import { useRegisterMutation } from '../../services/api';
import { registerStart, registerSuccess, registerFailure } from '../../store/slices/authSlice';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const [register] = useRegisterMutation();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    dispatch(registerStart());

    try {
      console.log('Starting registration...');
      const result = await register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
      }).unwrap();

      console.log('Registration result:', result);

      // The new auth endpoint returns { id, username, email, message }
      if (result.id) {
        console.log('Registration successful, logging in...');
        
        const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
        console.log('Using API URL:', apiUrl);
        
        // After successful registration, login to get token
        const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${encodeURIComponent(email.trim().toLowerCase())}&password=${encodeURIComponent(password)}`,
        });

        if (!loginResponse.ok) {
          throw new Error(`Login after registration failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginResult = await loginResponse.json();
        console.log('Login result:', loginResult);

        if (loginResult.access_token) {
          console.log('Got access token, fetching profile...');
          
          // Fetch user profile to get complete data
          const profileResponse = await fetch(`${apiUrl}/api/v1/users/profile`, {
            headers: {
              'Authorization': `Bearer ${loginResult.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed: ${profileResponse.status} ${profileResponse.statusText}`);
          }

          const userProfile = await profileResponse.json();
          console.log('Got user profile:', userProfile);

          const user = {
            id: userProfile.id,
            email: userProfile.email,
            username: userProfile.username,
            rating: userProfile.rating || 1200,
            games_played: userProfile.games_played || 0,
            games_won: userProfile.games_won || 0,
            tiger_wins: userProfile.tiger_wins || 0,
            goat_wins: userProfile.goat_wins || 0,
            created_at: userProfile.created_at || new Date().toISOString(),
          };

          console.log('Dispatching registration success...');
          dispatch(registerSuccess({
            access_token: loginResult.access_token,
            refresh_token: loginResult.access_token, // Use same token for refresh for now
            user,
          }));
          
          Alert.alert('Success', 'Account created successfully! Welcome to Baghchal Royale!');
          console.log('Registration completed successfully');
        } else {
          throw new Error('Registration successful but login failed - no token received');
        }
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.data?.detail || error.message || 'Registration failed. Please try again.';
      dispatch(registerFailure(errorMessage));
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Join Baghchal Royale</Text>
          <Text style={styles.subtitle}>Create your account to start playing</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={onNavigateToLogin}
              disabled={loading}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 350,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginLinkText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  loginLinkHighlight: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 