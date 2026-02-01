import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../store';
import { setShowGameRules } from '../../store/slices/uiSlice';
import { useAppTheme } from '../../theme';

const { width } = Dimensions.get('window');

const RulesModal: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const showGameRules = useSelector((state: RootState) => state.ui.showGameRules);

  const handleClose = () => {
    dispatch(setShowGameRules(false));
  };

  return (
    <Modal
      visible={showGameRules}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Game Rules</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              Baghchal (बाघचाल) is a traditional Nepali strategy board game, also known as "Tigers and Goats" or "Moving Tigers." It is considered the national game of Nepal with origins dating back centuries.
            </Text>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              The game is played between two players with asymmetric forces: one controls 4 Tigers, the other controls 20 Goats.
            </Text>
          </View>

          {/* Board */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>The Board</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              The game is played on a 5×5 grid with 25 intersection points. Pieces are placed on the intersections, not inside squares. The board has diagonal lines connecting certain points, indicating valid movement paths.
            </Text>
          </View>

          {/* Setup */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Game Setup</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              • The 4 Tigers start on the four corner points of the board{'\n'}
              • No Goats are on the board initially{'\n'}
              • Goats move first
            </Text>
          </View>

          {/* Phase 1 */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.phaseIcon, { backgroundColor: theme.colors.goatColor }]}>
                <Text style={styles.phaseNumber}>1</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Phase 1: Placement</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              • The Goat player places one goat at a time on any empty intersection{'\n'}
              • This continues until all 20 goats are placed on the board{'\n'}
              • During this phase, Tigers can move and capture goats
            </Text>
          </View>

          {/* Phase 2 */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.phaseIcon, { backgroundColor: theme.colors.tigerColor }]}>
                <Text style={styles.phaseNumber}>2</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Phase 2: Movement</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              Once all 20 goats are placed, both sides can move their pieces:{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>Goat Movement:</Text>{'\n'}
              • Move to an adjacent empty point along a line{'\n'}
              • Goats cannot jump or capture{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>Tiger Movement:</Text>{'\n'}
              • Move to an adjacent empty point along a line{'\n'}
              • OR jump over a goat to capture it (goat must have empty space behind it)
            </Text>
          </View>

          {/* Captures */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color={theme.colors.tigerColor} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tiger Captures</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              • Tigers capture by jumping over a goat to an empty space directly behind it{'\n'}
              • The jump must be along a valid line (horizontal, vertical, or diagonal){'\n'}
              • Only one goat can be captured per turn{'\n'}
              • Capturing is not mandatory{'\n'}
              • Tigers cannot jump over other tigers
            </Text>
          </View>

          {/* Winning */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={24} color={theme.colors.success} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Winning Conditions</Text>
            </View>
            <View style={[styles.winBox, { backgroundColor: theme.colors.tigerColor + '20', borderColor: theme.colors.tigerColor }]}>
              <Text style={[styles.winTitle, { color: theme.colors.tigerColor }]}>Tigers Win</Text>
              <Text style={[styles.winText, { color: theme.colors.onSurfaceVariant }]}>
                Capture 5 or more goats
              </Text>
            </View>
            <View style={[styles.winBox, { backgroundColor: theme.colors.goatColor + '20', borderColor: theme.colors.goatColor }]}>
              <Text style={[styles.winTitle, { color: theme.colors.goatColor }]}>Goats Win</Text>
              <Text style={[styles.winText, { color: theme.colors.onSurfaceVariant }]}>
                Block all 4 tigers so they cannot move or capture
              </Text>
            </View>
          </View>

          {/* Strategy Tips */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Strategy Tips</Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
              <Text style={{ fontWeight: 'bold' }}>For Goats:</Text>{'\n'}
              • Focus on surrounding and trapping tigers{'\n'}
              • Avoid isolated goats that can be easily captured{'\n'}
              • Work together to form blocking patterns{'\n'}
              • With perfect play, goats can always win!{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>For Tigers:</Text>{'\n'}
              • Stay mobile and avoid getting boxed in{'\n'}
              • Look for capture opportunities early{'\n'}
              • Control the center of the board{'\n'}
              • Create threats in multiple directions
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  phaseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumber: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  winBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  winTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winText: {
    fontSize: 14,
  },
});

export default RulesModal;
