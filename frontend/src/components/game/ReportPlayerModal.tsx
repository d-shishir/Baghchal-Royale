import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateReportMutation } from '../../services/api';
import { User, ReportCreate } from '../../services/types';

interface ReportPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  reportedPlayer: User;
  reporterId: string | undefined;
}

const ReportPlayerModal: React.FC<ReportPlayerModalProps> = ({
  visible,
  onClose,
  reportedPlayer,
  reporterId,
}) => {
  const [reason, setReason] = useState<ReportCreate['category'] | null>(null);
  const [description, setDescription] = useState('');
  const [createReport, { isLoading }] = useCreateReportMutation();

  const handleReport = async () => {
    if (!reporterId) {
      Alert.alert('Error', 'You must be logged in to report a player.');
      return;
    }
    if (!reason) {
      Alert.alert('Error', 'Please select a reason for the report.');
      return;
    }

    try {
      await createReport({
        reporter_id: reporterId,
        reported_user_id: reportedPlayer.user_id,
        category: reason,
        description,
      }).unwrap();
      Alert.alert('Report Submitted', 'Thank you for your feedback. We will review the report shortly.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again later.');
    }
  };

  const renderReasonButton = (
    category: ReportCreate['category'],
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.reasonButton, reason === category && styles.selectedReason]}
      onPress={() => setReason(category)}
    >
      <Ionicons name={icon} size={24} color={reason === category ? '#fff' : '#FFC107'} />
      <Text style={[styles.reasonText, reason === category && styles.selectedReasonText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Report {reportedPlayer.username}</Text>

          <View style={styles.reasonsContainer}>
            {renderReasonButton('CHEATING', 'Cheating', 'ribbon-outline')}
            {renderReasonButton('HARASSMENT', 'Harassment', 'sad-outline')}
            {renderReasonButton('OTHER', 'Other', 'help-circle-outline')}
          </View>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Provide additional details (optional)"
            placeholderTextColor="#999"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleReport} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  reasonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  reasonButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFC107',
    width: '30%',
  },
  selectedReason: {
    backgroundColor: '#FFC107',
  },
  reasonText: {
    color: '#FFC107',
    marginTop: 5,
  },
  selectedReasonText: {
    color: '#fff',
  },
  descriptionInput: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReportPlayerModal; 