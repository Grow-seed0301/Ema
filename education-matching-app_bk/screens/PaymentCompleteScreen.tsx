import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type PaymentCompleteRouteProp = RouteProp<MainStackParamList, 'PaymentComplete'>;

export default function PaymentCompleteScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentCompleteRouteProp>();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    planName: string;
    amount: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      const { sessionId } = route.params;
      const response = await apiService.getPaymentStatus(sessionId);
      
      if (response.success && response.data) {
        setPaymentData({
          planName: response.data.plan?.name || route.params.planName || 'プラン',
          amount: response.data.payment.amount,
          status: response.data.payment.status,
        });
        
        // Refresh user data to update totalLessons in UI
        await refreshUser();
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      // Use route params as fallback
      if (route.params.planName && route.params.amount) {
        setPaymentData({
          planName: route.params.planName,
          amount: route.params.amount.toString(),
          status: 'completed',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `¥${num.toLocaleString()}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            決済情報を確認中...
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={[styles.content, { paddingTop: insets.top + Spacing['2xl'] }]}>
            <View style={styles.successSection}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '1A' }]}>
                <Feather name="check-circle" size={64} color={theme.primary} />
              </View>
              <View style={styles.textContainer}>
                <ThemedText style={styles.title}>決済が完了しました</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  ご購入ありがとうございます。{'\n'}レッスンの準備が整いました。
                </ThemedText>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText style={styles.summaryTitle}>購入プラン</ThemedText>
              
              <View style={[styles.summaryContent, { borderTopColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                    {paymentData?.planName || 'プラン'}
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {paymentData ? formatPrice(paymentData.amount) : '¥0'}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                    支払い方法
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>クレジットカード</ThemedText>
                </View>
              </View>

              <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                <ThemedText style={styles.totalLabel}>合計金額</ThemedText>
                <ThemedText style={styles.totalValue}>
                  {paymentData ? formatPrice(paymentData.amount) : '¥0'}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Pressable
              style={({ pressed }) => [
                styles.homeButton,
                { 
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <ThemedText style={styles.homeButtonText}>ホームに戻る</ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  successSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  summaryContent: {
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  footer: {
    padding: Spacing.lg,
  },
  homeButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
