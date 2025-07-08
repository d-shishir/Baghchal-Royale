import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  useGetMyFriendsQuery,
  useSearchUsersQuery,
  useCreateFriendshipMutation,
  useUpdateFriendshipMutation,
  useDeleteFriendshipMutation,
} from '../../services/api';
import { RootState } from '../../store';
import { Friendship, User, FriendshipStatus } from '../../services/types';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'friends' | 'requests' | 'search';

const FriendsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isGuest = useSelector((state: RootState) => state.auth.isGuest);

  // API hooks
  const { data: friendships, isLoading: friendsLoading, refetch } = useGetMyFriendsQuery(undefined, {
      skip: isGuest,
  });
  const { data: searchResults, isLoading: searchLoading } = useSearchUsersQuery(
    searchQuery,
    { skip: searchQuery.length < 2 || isGuest }
  );
  
  const [createFriendship] = useCreateFriendshipMutation();
  const [updateFriendship] = useUpdateFriendshipMutation();
  const [deleteFriendship] = useDeleteFriendshipMutation();

  const { friendsList, pendingRequests, sentRequests } = useMemo(() => {
    console.log('Friendships data:', friendships);
    console.log('Current User:', currentUser);

    if (!friendships || !currentUser?.user_id) {
      return { friendsList: [], pendingRequests: [], sentRequests: [] };
    }
    
    const friends: Friendship[] = [];
    const requests: Friendship[] = [];
    const sent: Friendship[] = [];

    friendships.forEach(f => {
      if (f.status === 'ACCEPTED') {
        friends.push(f);
      } else if (f.status === 'PENDING') {
          if (f.user_id_2 === currentUser?.user_id) {
            requests.push(f);
          } else if (f.user_id_1 === currentUser?.user_id) {
            sent.push(f);
          }
      }
    });
    
    return { friendsList: friends, pendingRequests: requests, sentRequests: sent };
  }, [friendships, currentUser]);

  const onRefresh = () => {
    console.log('Refreshing friend list...');
    refetch();
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send friend requests.');
        return;
    }
    try {
      await createFriendship({ user_id_1: currentUser.user_id, user_id_2: userId }).unwrap();
      Alert.alert('Success', 'Friend request sent!');
    } catch (error: any) {
        const message = error.data?.detail || 'Failed to send friend request';
      Alert.alert('Error', message);
    }
  };

  const handleRespondToRequest = async (friendshipId: string, accepted: boolean) => {
    try {
      const status = accepted ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED;
      await updateFriendship({ friendship_id: friendshipId, status }).unwrap();
      Alert.alert('Success', `Friend request ${accepted ? 'accepted' : 'declined'}!`);
    } catch (error) {
      Alert.alert('Error', `Failed to respond to friend request`);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFriendship({ friendship_id: friendshipId }).unwrap();
              Alert.alert('Success', 'Friend removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };
  
  if (isGuest) {
      return (
        <SafeAreaView style={styles.container}>
             <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyText}>Create an account to add friends!</Text>
            </View>
        </SafeAreaView>
      )
  }

  const renderFriend = ({ item }: { item: Friendship }) => {
    const friend = item.user_id_1 === currentUser?.user_id ? item.user2 : item.user1;
    return (
        <View style={styles.listItem}>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.username}</Text>
                <Text style={styles.friendStatus}>{friend.status}</Text>
            </View>
            <View style={styles.friendActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => {/* Navigate to chat or profile */}}>
                    <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleRemoveFriend(item.friendship_id)}>
                    <Ionicons name="person-remove-outline" size={24} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  const renderPendingRequest = ({ item }: { item: Friendship }) => {
    const requestor = item.user1;
    return(
    <View style={styles.listItem}>
        <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{requestor.username}</Text>
            <Text style={styles.friendStatus}>Wants to be your friend</Text>
        </View>
        <View style={styles.requestActions}>
            <TouchableOpacity style={styles.acceptButton} onPress={() => handleRespondToRequest(item.friendship_id, true)}>
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={() => handleRespondToRequest(item.friendship_id, false)}>
                <Ionicons name="close-circle-outline" size={32} color={theme.colors.error} />
            </TouchableOpacity>
        </View>
    </View>
  )};

  const renderSearchResult = ({ item }: { item: User }) => {
    const existingFriendship = friendships?.find(
        f => f.user_id_1 === item.user_id || f.user_id_2 === item.user_id
    );

    let buttonContent = (
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.user_id)}
      >
        <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
      </TouchableOpacity>
    );

    if (existingFriendship) {
      const status = existingFriendship.status;
      let text = '';
      if (status === 'ACCEPTED') {
        text = 'Friends';
      } else if (status === 'PENDING') {
        if (existingFriendship.user_id_1 === currentUser?.user_id) {
            text = 'Request Sent';
        } else {
            text = 'Pending';
        }
      } else if (status === 'DECLINED') {
        text = 'Declined';
      }
      
      if (text) {
          buttonContent = (
            <View style={styles.pendingContainer}>
                <Text style={styles.pendingText}>{text}</Text>
            </View>
          );
      }
    }


    return (
        <View style={styles.listItem}>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.username}</Text>
            <Text style={styles.friendStatus}>Rating: {item.rating}</Text>
          </View>
          {buttonContent}
        </View>
      );
  }

  const renderTabContent = () => {
    const isLoading = friendsLoading || searchLoading;
    if (isLoading) {
        return <ActivityIndicator style={{marginTop: 20}} size="large" color={theme.colors.primary} />
    }
      
    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friendsList}
            renderItem={renderFriend}
            keyExtractor={(item) => item.friendship_id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={friendsLoading} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}><Text style={styles.emptyText}>No friends yet. Add some friends!</Text></View>
            }
          />
        );
      case 'requests':
        return (
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item.friendship_id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={friendsLoading} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
                <View style={styles.emptyStateContainer}><Text style={styles.emptyText}>No pending friend requests</Text></View>
            }
          />
        );
      case 'search':
        return (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="none"
            />
            <FlatList
              data={searchResults || []}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.user_id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                searchQuery.length >= 2 ? (
                  <View style={styles.emptyStateContainer}><Text style={styles.emptyText}>No users found</Text></View>
                ) : (
                  <View style={styles.emptyStateContainer}><Text style={styles.emptyText}>Type at least 2 characters to search</Text></View>
                )
              }
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friendsList?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  listContainer: {
    padding: 16,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    margin: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  friendStatus: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  friendActions: {
      flexDirection: 'row'
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
      marginLeft: 15,
  },
  addButton: {
    padding: 8,
  },
  acceptButton: {
    padding: 8,
    marginRight: 8,
  },
  declineButton: {
    padding: 8,
  },
  pendingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceVariant,
  },
  pendingText: {
      color: theme.colors.onSurface,
      fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default FriendsScreen; 