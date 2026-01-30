import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Button, Input, Card, EmptyState, Toggle, PointsDisplay, Confetti } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { Reward, RewardType } from '../types';
import * as Haptics from '../utils/haptics';

export const RewardsScreen: React.FC = () => {
  const {
    rewards,
    pointsSummary,
    createReward,
    updateReward,
    deleteReward,
    redeemReward,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<RewardType>('one_shot');
  const [showConfetti, setShowConfetti] = useState(false);

  const availableRewards = rewards.filter((r) => r.status === 'available');
  const unlockedRewards = rewards.filter((r) => r.status === 'unlocked');

  const handleOpenModal = useCallback((reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setName(reward.name);
      setDescription(reward.description || '');
      setCost(reward.cost.toString());
      setType(reward.type);
    } else {
      setEditingReward(null);
      setName('');
      setDescription('');
      setCost('');
      setType('one_shot');
    }
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingReward(null);
    setName('');
    setDescription('');
    setCost('');
    setType('one_shot');
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a reward name');
      return;
    }
    const costValue = parseInt(cost, 10);
    if (isNaN(costValue) || costValue <= 0) {
      Alert.alert('Error', 'Please enter a valid cost');
      return;
    }

    try {
      if (editingReward) {
        await updateReward(editingReward.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          cost: costValue,
          type,
        });
      } else {
        await createReward({
          name: name.trim(),
          description: description.trim() || undefined,
          cost: costValue,
          type,
        });
      }
      handleCloseModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reward');
    }
  }, [name, description, cost, type, editingReward, createReward, updateReward, handleCloseModal]);

  const handleRedeem = useCallback(async (reward: Reward) => {
    if (pointsSummary.spendable < reward.cost) {
      Haptics.warningNotification();
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.cost - pointsSummary.spendable} more points to redeem this reward.`
      );
      return;
    }

    Haptics.lightTap();
    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.name}" for ${reward.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            const success = await redeemReward(reward);
            if (success) {
              Haptics.rewardRedemption();
              setShowConfetti(true);
            }
          },
        },
      ]
    );
  }, [pointsSummary.spendable, redeemReward]);

  const handleDelete = useCallback((reward: Reward) => {
    Alert.alert(
      'Delete Reward',
      `Are you sure you want to delete "${reward.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReward(reward.id),
        },
      ]
    );
  }, [deleteReward]);

  const renderReward = useCallback(({ item }: { item: Reward }) => {
    const canAfford = pointsSummary.spendable >= item.cost;
    const isUnlocked = item.status === 'unlocked';

    return (
      <View>
        <Card style={[styles.rewardCard, isUnlocked ? styles.rewardCardUnlocked : undefined]}>
          <View style={styles.rewardHeader}>
            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardName, isUnlocked && styles.rewardNameUnlocked]}>
                {item.name}
              </Text>
              {item.description && (
                <Text style={styles.rewardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            {!isUnlocked && (
              <TouchableOpacity
                onPress={() => handleOpenModal(item)}
                style={styles.editButton}
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rewardFooter}>
            <View style={styles.rewardMeta}>
              <Text style={styles.rewardCost}>{item.cost} pts</Text>
              <View style={[styles.typeBadge, item.type === 'permanent' && styles.typeBadgePermanent]}>
                <Text style={[styles.typeText, item.type === 'permanent' && styles.typeTextPermanent]}>
                  {item.type === 'one_shot' ? 'One-time' : 'Permanent'}
                </Text>
              </View>
            </View>

            {isUnlocked ? (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>Unlocked ✨</Text>
              </View>
            ) : canAfford ? (
              <Button
                title="Redeem"
                onPress={() => handleRedeem(item)}
                size="sm"
              />
            ) : (
              <Text style={styles.insufficientText}>
                {item.cost - Math.round(pointsSummary.spendable)} pts missing
              </Text>
            )}
          </View>

          {!isUnlocked && (
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </Card>
      </View>
    );
  }, [pointsSummary.spendable, handleRedeem, handleOpenModal, handleDelete]);

  const ListHeader = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Rewards</Text>
      <PointsDisplay pointsSummary={pointsSummary} />

      {availableRewards.length > 0 && (
        <Text style={styles.sectionTitle}>Available Rewards</Text>
      )}
    </View>
  );

  const ListFooter = unlockedRewards.length > 0 ? (
    <View style={styles.unlockedSection}>
      <Text style={styles.sectionTitle}>Unlocked Rewards</Text>
      {unlockedRewards.map((reward) => (
        <Card key={reward.id} style={styles.unlockedCard}>
          <Text style={styles.unlockedName}>{reward.name}</Text>
          <Text style={styles.unlockedDate}>
            Unlocked {new Date(reward.redeemedAt!).toLocaleDateString()}
          </Text>
        </Card>
      ))}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Confetti
        visible={showConfetti}
        count={40}
        duration={2000}
        onComplete={() => setShowConfetti(false)}
      />
      {rewards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PointsDisplay pointsSummary={pointsSummary} containerStyle={styles.emptyPoints} />
          <EmptyState
            emoji="🎁"
            title="No rewards yet"
            description="Create rewards to motivate yourself! Spend your earned points on things you enjoy."
            actionLabel="Add Reward"
            onAction={() => handleOpenModal()}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={availableRewards}
            keyExtractor={(item) => item.id}
            renderItem={renderReward}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No available rewards. Add some or earn more points!
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => handleOpenModal()}
              activeOpacity={0.8}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        visible={showModal === true}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReward ? 'Edit Reward' : 'New Reward'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Reward Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Favorite Pizza"
              />

              <Input
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Large pepperoni from Tony's"
                multiline={true}
              />

              <Input
                label="Cost (points)"
                value={cost}
                onChangeText={setCost}
                placeholder="50"
                keyboardType="numeric"
              />

              <View style={styles.typeSection}>
                <Text style={styles.typeLabel}>Reward Type</Text>
                <View style={styles.typeOptions}>
                  <TouchableOpacity
                    style={[styles.typeOption, type === 'one_shot' && styles.typeOptionSelected]}
                    onPress={() => setType('one_shot')}
                  >
                    <Text style={[styles.typeOptionText, type === 'one_shot' && styles.typeOptionTextSelected]}>
                      One-time
                    </Text>
                    <Text style={styles.typeOptionDesc}>Consumed when redeemed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeOption, type === 'permanent' && styles.typeOptionSelected]}
                    onPress={() => setType('permanent')}
                  >
                    <Text style={[styles.typeOptionText, type === 'permanent' && styles.typeOptionTextSelected]}>
                      Permanent
                    </Text>
                    <Text style={styles.typeOptionDesc}>Unlocked forever</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingReward ? 'Save' : 'Create'}
                onPress={handleSave}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyPoints: {
    marginBottom: Spacing.lg,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rewardCard: {
    marginBottom: Spacing.md,
  },
  rewardCardUnlocked: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  rewardNameUnlocked: {
    color: Colors.success,
  },
  rewardDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  editButton: {
    padding: Spacing.xs,
  },
  editText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  rewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardCost: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  typeBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgePermanent: {
    backgroundColor: Colors.safe + '20',
  },
  typeText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  typeTextPermanent: {
    color: Colors.safe,
  },
  unlockedBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  unlockedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.success,
  },
  insufficientText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  deleteButton: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  unlockedSection: {
    marginTop: Spacing.lg,
  },
  unlockedCard: {
    backgroundColor: Colors.success + '10',
    marginBottom: Spacing.sm,
  },
  unlockedName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.success,
  },
  unlockedDate: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  emptyList: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Shadows.lg.shadowColor,
    shadowOffset: Shadows.lg.shadowOffset,
    shadowOpacity: Shadows.lg.shadowOpacity,
    shadowRadius: Shadows.lg.shadowRadius,
    elevation: Shadows.lg.elevation,
  },
  fabText: {
    fontSize: 32,
    fontWeight: FontWeights.regular,
    color: Colors.textOnPrimary,
    lineHeight: 36,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
    lineHeight: 32,
  },
  typeSection: {
    marginTop: Spacing.md,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  typeOptions: {
    flexDirection: 'row',
  },
  typeOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  typeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeOptionText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  typeOptionTextSelected: {
    color: Colors.primary,
  },
  typeOptionDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});
