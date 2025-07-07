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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useRegisterMutation } from '../../services/api';
import { AuthStackParamList } from '../../navigation/MainNavigator';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [register, { isLoading, error, isSuccess }] = useRegisterMutation();

  useEffect(() => {
    if (isSuccess) {
      Alert.alert(
        'Registration Successful',
        'Please log in with your new credentials.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
    if (error && 'data' in error) {
      const errorData = error.data as { detail?: string };
      Alert.alert('Registration Failed', errorData.detail || 'An unknown error occurred.');
    }
  }, [isSuccess, error, navigation]);

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
        Alert.alert('Validation Error', 'Please fill in all fields.');
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
    }
    
    await register({ email, username, password });
  };
  
  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoSection}>
             <TouchableOpacity onPress={handleNavigateToLogin} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/br.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>Create your Baghchal Royale account</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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

             <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#777'] : ['#FF6F00', '#FF8F00']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleNavigateToLogin} disabled={isLoading}>
              <Text style={[styles.loginLink, isLoading && styles.disabledText]}>
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
        paddingHorizontal: 30,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 0,
        zIndex: 1
    },
    logoImage: {
        width: 100,
        height: 100,
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
        textAlign: 'center'
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
    registerButton: {
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
    registerButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    disabledText: {
        color: '#666',
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
    loginLink: {
        color: '#FF6F00',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
});

export default RegisterScreen; 