import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { RootState } from '../../store';
import { startLocalGame } from '../../store/slices/gameSlice';
import { Game, GamePlayer } from '../../services/types';
import { GameStatus } from '../../game-logic/baghchal';
import { initialGameState } from '../../game-logic/initialState';

type NavProps = StackNavigationProp<MainStackParamList, 'SinglePlayerSetup'>;

const { width } = Dimensions.get('window');

const SinglePlayerSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavProps>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [selectedSide, setSelectedSide] = useState<'TIGER' | 'GOAT'>('GOAT');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  const sideOptions = [
    {
      id: 'TIGER' as const,
      title: 'Tigers',
      description: 'Hunt and capture goats',
      icon: 'flash' as 'flash',
      advantages: ['First move advantage', 'Strong individual pieces', 'Offensive playstyle'],
      objective: 'Capture 5 goats to win',
      color: ['#FF5722', '#FF7043'],
    },
    {
      id: 'GOAT' as const,
      title: 'Goats',
      description: 'Block tigers from moving',
      icon: 'shield' as 'shield',
      advantages: ['Numerical advantage', 'Defensive strategy', 'Team coordination'],
      objective: 'Block all tiger movements',
      color: ['#4CAF50', '#66BB6A'],
    },
  ];

  const difficultyOptions = [
    {
      id: 'EASY' as const,
      title: 'Easy',
      description: 'Perfect for beginners',
      aiLevel: 'Random AI with basic strategy',
      color: '#4CAF50',
    },
    {
      id: 'MEDIUM' as const,
      title: 'Medium',
      description: 'Balanced challenge',
      aiLevel: 'Trained Q-Learning AI',
      color: '#FF9800',
    },
    {
      id: 'HARD' as const,
      title: 'Hard',
      description: 'Expert level challenge',
      aiLevel: 'Advanced Q-Learning AI',
      color: '#F44336',
    },
  ];

  const handleStartGame = () => {
    const gameId = `local-ai-${Date.now()}`;
    const userPlayer: GamePlayer = { 
        id: user?.user_id || 'guest-player', 
        username: user?.username || 'Guest' 
    };
    const aiPlayer: GamePlayer = { id: 'ai-player', username: `AI (${selectedDifficulty})` };

    const player1 = selectedSide === 'TIGER' ? userPlayer : aiPlayer;
    const player2 = selectedSide === 'GOAT' ? userPlayer : aiPlayer;

    const localGame: Game = {
        game_id: gameId,
        player1_id: player1.id,
        player2_id: player2.id,
        player1,
        player2,
        status: GameStatus.IN_PROGRESS,
        game_state: initialGameState,
        game_type: 'AI',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    dispatch(startLocalGame(localGame));
    navigation.navigate('Game', { 
        gameId: gameId, 
        playerSide: selectedSide, 
        aiDifficulty: selectedDifficulty 
    });
  };

  const renderSideCard = (side: typeof sideOptions[0]) => {
    const isSelected = selectedSide === side.id;
    
    return (
      <TouchableOpacity
        key={side.id}
        style={[styles.sideCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedSide(side.id)}
      >
                 <LinearGradient 
           colors={isSelected ? side.color as [string, string] : ['#2A2A2A', '#1E1E1E']} 
           style={styles.sideCardGradient}
         >
          <View style={styles.sideCardHeader}>
            <View style={styles.sideIconContainer}>
              <Ionicons name={side.icon} size={32} color="#FFF" />
            </View>
            <View style={styles.sideInfo}>
              <Text style={styles.sideTitle}>{side.title}</Text>
              <Text style={styles.sideDescription}>{side.description}</Text>
            </View>
            {isSelected && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              </View>
            )}
          </View>

          <View style={styles.sideContent}>
            <Text style={styles.objectiveText}>{side.objective}</Text>
            
            <View style={styles.advantagesContainer}>
              <Text style={styles.advantagesTitle}>Advantages:</Text>
              {side.advantages.map((advantage, index) => (
                <View key={index} style={styles.advantageItem}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.advantageText}>{advantage}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderDifficultyCard = (difficulty: typeof difficultyOptions[0]) => {
    const isSelected = selectedDifficulty === difficulty.id;
    
    return (
      <TouchableOpacity
        key={difficulty.id}
        style={[
          styles.difficultyCard,
          isSelected && styles.selectedDifficultyCard,
          { borderLeftColor: difficulty.color }
        ]}
        onPress={() => setSelectedDifficulty(difficulty.id)}
      >
        <View style={styles.difficultyHeader}>
          <View style={styles.difficultyInfo}>
            <Text style={styles.difficultyTitle}>{difficulty.title}</Text>
            <Text style={styles.difficultyDescription}>{difficulty.description}</Text>
            <Text style={styles.aiLevelText}>{difficulty.aiLevel}</Text>
          </View>
          
          {isSelected && (
            <View style={styles.difficultyCheckmark}>
              <Ionicons name="radio-button-on" size={24} color={difficulty.color} />
            </View>
          )}
          {!isSelected && (
            <View style={styles.difficultyCheckmark}>
              <Ionicons name="radio-button-off" size={24} color="#666" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Single Player Setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Choose Your Side Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Side</Text>
          <Text style={styles.sectionSubtitle}>
            Each side has unique strategies and win conditions
          </Text>
          
          <View style={styles.sideCardsContainer}>
            {sideOptions.map(renderSideCard)}
          </View>
        </View>

        {/* Choose Difficulty Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Difficulty</Text>
          <Text style={styles.sectionSubtitle}>
            Select the challenge level for your AI opponent
          </Text>
          
          <View style={styles.difficultyContainer}>
            {difficultyOptions.map(renderDifficultyCard)}
          </View>
        </View>

        {/* Game Info Section */}
        <View style={styles.gameInfoSection}>
          <View style={styles.gameInfoCard}>
            <Text style={styles.gameInfoTitle}>Game Rules Reminder</Text>
            <View style={styles.rulesList}>
              <View style={styles.ruleItem}>
                <Ionicons name="play" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Tigers move first in the game</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="trophy" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Tigers win by capturing 5 goats</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="shield" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Goats win by blocking all tiger movements</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="layers" size={16} color="#4CAF50" />
                <Text style={styles.ruleText}>Game has placement and movement phases</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Game Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <LinearGradient
            colors={['#FF6F00', '#FF8F00']}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  sideCardsContainer: {
    gap: 16,
  },
  sideCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  sideCardGradient: {
    padding: 20,
  },
  sideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sideIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sideInfo: {
    flex: 1,
  },
  sideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  sideDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkmark: {
    marginLeft: 12,
  },
  sideContent: {
    marginTop: 8,
  },
  objectiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  advantagesContainer: {
    marginTop: 8,
  },
  advantagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  advantageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  difficultyContainer: {
    gap: 12,
  },
  difficultyCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  selectedDifficultyCard: {
    backgroundColor: '#2A2A2A',
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyInfo: {
    flex: 1,
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 6,
  },
  aiLevelText: {
    fontSize: 12,
    color: '#999',
  },
  difficultyCheckmark: {
    marginLeft: 12,
  },
  gameInfoSection: {
    padding: 20,
    paddingTop: 0,
  },
  gameInfoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
  },
  gameInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default SinglePlayerSetupScreen; 