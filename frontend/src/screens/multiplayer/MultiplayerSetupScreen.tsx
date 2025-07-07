import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import QuickMatchModal from '../../components/game/QuickMatchModal';

const MultiplayerSetupScreen = () => {
  const [isQuickMatchModalVisible, setQuickMatchModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <QuickMatchModal 
            visible={isQuickMatchModalVisible} 
            onClose={() => setQuickMatchModalVisible(false)} 
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
          <Text style={styles.title}>Multiplayer</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.content}>
            <Text style={styles.promptTitle}>Ready for a Challenge?</Text>
            <Text style={styles.promptSubtitle}>Jump into a random match against players from around the world.</Text>
            <TouchableOpacity style={styles.megaButton} onPress={() => setQuickMatchModalVisible(true)}>
                <Ionicons name="flash" size={32} color="#FFF" />
                <Text style={styles.megaButtonText}>Quick Match</Text>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    promptTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    promptSubtitle: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: '80%',
    },
    megaButton: { 
        flexDirection: 'row', 
        backgroundColor: 'rgba(233, 69, 96, 0.8)', 
        paddingVertical: 20,
        paddingHorizontal: 40, 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 8, 
        shadowColor: '#000', 
        shadowOpacity: 0.4, 
        shadowRadius: 8, 
        shadowOffset: { width: 0, height: 4 } 
    },
    megaButtonText: { color: 'white', marginLeft: 15, fontWeight: 'bold', fontSize: 22 },
});

export default MultiplayerSetupScreen; 