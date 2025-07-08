import React, { useState, useEffect } from 'react';
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
import { useLoginMutation } from '../../services/api';
import { setGuest } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/MainNavigator';
import { User } from '../../services/types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [login, { isLoading, error }] = useLoginMutation();

  useEffect(() => {
    if (error && 'data' in error) {
        const errorData = error.data as { detail?: string };
        Alert.alert('Login Failed', errorData.detail || 'An unknown error occurred.');
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
        Alert.alert('Validation Error', 'Please enter both email and password.');
        return;
    }

    await login({ username: email, password });
  };
  
  const handleGuestLogin = () => {
    const guestUser: User = {
        user_id: `guest-${Date.now()}`,
        email: 'guest@baghchal-royale.com',
        username: 'Guest',
        role: 'USER', // The UI doesn't distinguish roles, so this is fine.
        status: 'ONLINE',
        rating: 0,
        created_at: new Date().toISOString()
    };
    dispatch(setGuest(guestUser));
  };
  
  const handleNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'This feature is not yet implemented.');
  };

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoSection}>
            <Image
              source={require('../../../assets/br.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>बाघचाल Royale</Text>
            <Text style={styles.subtitle}>Welcome Back!</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#777'] : ['#FF6F00', '#FF8F00']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.guestButton, isLoading && styles.buttonDisabled]} 
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              <Text style={[styles.guestButtonText, isLoading && styles.disabledText]}>
                Play as Guest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={[styles.forgotPasswordText, isLoading && styles.disabledText]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleNavigateToRegister} disabled={isLoading}>
              <Text style={[styles.registerLink, isLoading && styles.disabledText]}>
                Sign Up Now
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
    paddingHorizontal: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
    marginTop: 8,
  },
  formSection: {
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
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#999',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#666',
  },
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 16,
  },
  registerLink: {
    color: '#FF6F00',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LoginScreen; 