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
import { useLoginMutation, useGetProfileQuery } from '../../services/api';
import { loginStart, loginSuccess, loginFailure, guestLogin } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/MainNavigator';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email) && email !== 'guest') {
      newErrors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6 && password !== 'guest') {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    dispatch(loginStart());

    try {
      console.log('Starting login...');
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      console.log('Login result:', result);

      // Backend returns { success: true, message: "...", data: { access_token, refresh_token, user_id, username } }
      if (result.success && result.data && result.data.access_token) {
        console.log('Login successful, creating user object...');
        
        // Create a basic user object from the response
        const basicUser = {
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

        console.log('Dispatching login success...');
        dispatch(loginSuccess({
          access_token: result.data.access_token,
          user: basicUser,
        }));
        
        console.log('Login completed successfully');
      } else {
        throw new Error('Login failed - no token received');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.data?.detail || error.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(errorMessage));
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Alert.alert(
      'Guest Mode',
      'Play as guest? You won\'t be able to save your progress or compete in rankings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            const guestUser = {
              id: 'guest-' + Date.now(),
              email: 'guest@baghchal.com',
              username: 'Guest Player',
              rating: 1200,
              games_played: 0,
              games_won: 0,
              tiger_wins: 0,
              goat_wins: 0,
              created_at: new Date().toISOString(),
            };
            dispatch(guestLogin(guestUser));
          }
        },
      ]
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact support to reset your password.\nEmail: support@baghchal.com',
      [{ text: 'OK' }]
    );
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
            <Text style={styles.subtitle}>Welcome Back!</Text>
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#666', '#777'] : ['#FF6F00', '#FF8F00']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.guestButton, loading && styles.buttonDisabled]} 
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <Text style={[styles.guestButtonText, loading && styles.disabledText]}>
                Play as Guest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, loading && styles.disabledText]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Section */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.buttonDisabled]} 
              onPress={handleNavigateToRegister}
              disabled={loading}
            >
              <Text style={[styles.registerButtonText, loading && styles.disabledText]}>
                Sign Up
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
  loginButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  guestButtonText: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#FF6F00',
    fontSize: 16,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#CCC',
    fontSize: 16,
    marginRight: 8,
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  registerButtonText: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#666',
  },
});

export default LoginScreen; 