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
import { initialGameState } from '../../game-logic/initialState';
import { GameState } from '../../game-logic/baghchal';

const MultiplayerSetupScreen = () => {
  const [isQuickMatchModalVisible, setQuickMatchModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  const handlePVPOnDevice = () => {
    const gameId = `local-pvp-${Date.now()}`;
    navigation.navigate('Game', {
      gameId: gameId,
      gameMode: 'local',
      initialGameState: initialGameState,
    });
  };

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

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handlePVPOnDevice}>
                <Ionicons name="phone-portrait-outline" size={24} color="#FFF" />
                <Text style={styles.secondaryButtonText}>PVP on Device</Text>
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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.5)',
        marginHorizontal: 15,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    secondaryButtonText: {
        color: 'white',
        marginLeft: 15,
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default MultiplayerSetupScreen; 