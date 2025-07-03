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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRegisterMutation } from '../../services/api';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/MainNavigator';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    username?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});
  
  const dispatch = useDispatch();
  const [register] = useRegisterMutation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      username?: string; 
      password?: string; 
      confirmPassword?: string 
    } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    dispatch(loginStart());

    try {
      console.log('Starting registration...');
      const result = await register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
      }).unwrap();

      console.log('Registration result:', result);

      // Backend returns { success: true, message: "...", data: { access_token, refresh_token, user_id, username } }
      if (result.success && result.data) {
        console.log('Registration successful!');
        
        // Create a basic user object from the registration response
        const user = {
          id: result.data.user_id,
          email: email.trim().toLowerCase(),
          username: result.data.username,
          rating: 1200,
          games_played: 0,
          games_won: 0,
          tiger_wins: 0,
          goat_wins: 0,
          created_at: new Date().toISOString(),
        };

        console.log('Dispatching registration success...');
        dispatch(loginSuccess({
          access_token: result.data.access_token,
          user,
        }));
        
        Alert.alert('Success', 'Account created successfully! Welcome to Baghchal Royale!');
        console.log('Registration completed successfully');
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.data?.detail || error.message || 'Registration failed. Please try again.';
      dispatch(loginFailure(errorMessage));
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../../assets/br.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>बाघचाल Royale</Text>
            <Text style={styles.subtitle}>Create Your Account</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({...errors, email: undefined});
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) setErrors({...errors, username: undefined});
                }}
                autoCapitalize="none"
                autoComplete="username"
                editable={!loading}
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({...errors, password: undefined});
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: undefined});
                }}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#666', '#777'] : ['#FF6F00', '#FF8F00']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Section */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleNavigateToLogin}
              disabled={loading}
            >
              <Text style={[styles.loginButtonText, loading && styles.disabledText]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#CCC',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 16,
  },
  registerButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#CCC',
    fontSize: 16,
    marginRight: 8,
  },
  loginButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  loginButtonText: {
    color: '#FF6F00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#666',
  },
});

export default RegisterScreen; 