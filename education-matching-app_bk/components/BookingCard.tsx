import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { BOOKING_STATUS, BookingStatus } from '@/constants/booking';

interface BaseBooking {
  id: string;
  date: string;
  time: string;
  dayOfWeek: string;
  avatarColor: string;
}

export interface UserBooking extends BaseBooking {
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string | null;
  lessonTitle: string;
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  isCompleted: boolean;
  hasReview?: boolean;
}

export interface TeacherBooking extends BaseBooking {
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  lessonType: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  cancelReason?: string | null;
  hasReview: boolean;
  review?: {
    rating: number;
    content?: string;
    createdAt?: string;
  };
}

interface BookingCardProps {
  booking: UserBooking | TeacherBooking;
  theme: any;
  mode: 'user' | 'teacher';
  onPress?: () => void;
  onReviewPress?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onViewStudentDetails?: () => void;
  isProcessing?: boolean;
}

function isUserBooking(booking: UserBooking | TeacherBooking): booking is UserBooking {
  return 'teacherId' in booking;
}

export default function BookingCard({
  booking,
  theme,
  mode,
  onPress,
  onReviewPress,
  onApprove,
  onReject,
  onViewStudentDetails,
  isProcessing = false,
}: BookingCardProps) {
  const isPending = !isUserBooking(booking) && booking.status === BOOKING_STATUS.PENDING;
  const isTeacherMode = mode === 'teacher';
  const [imageError, setImageError] = React.useState(false);

  const avatarUrl = isTeacherMode 
    ? (!isUserBooking(booking) ? booking.studentAvatar : null)
    : (isUserBooking(booking) ? booking.teacherAvatar : null);
  
  const avatarInitial = isTeacherMode
    ? (!isUserBooking(booking) ? booking.studentName.charAt(0) : '')
    : (isUserBooking(booking) ? booking.teacherName.charAt(0) : '');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: pressed && onPress ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Avatar and Main Info */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: booking.avatarColor }]}>
          {avatarUrl && !imageError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <ThemedText style={styles.avatarText}>
              {avatarInitial}
            </ThemedText>
          )}
        </View>

        <View style={styles.info}>
          {/* Date and Time */}
          <View style={styles.dateRow}>
            <ThemedText style={[styles.dateText, { color: theme.textTertiary }]}>
              {booking.date} ({booking.dayOfWeek}) {booking.time}
            </ThemedText>
            {isUserBooking(booking) && booking.isCompleted && (
              <View style={styles.completedBadge}>
                <ThemedText style={styles.completedText}>完了</ThemedText>
              </View>
            )}
            {!isUserBooking(booking) && isPending && (
              <ThemedText style={[styles.priorityBadge, { color: '#F59E0B' }]}>
                承認待ち
              </ThemedText>
            )}
          </View>

          {/* Name */}
          <ThemedText style={styles.name}>
            {isUserBooking(booking) ? booking.teacherName : booking.studentName}
          </ThemedText>

          {/* Lesson Title / Type */}
          <ThemedText
            style={[styles.lessonTitle, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {isUserBooking(booking) ? booking.lessonTitle : booking.lessonType}
          </ThemedText>

          {/* Notes (Teacher mode only) */}
          {!isUserBooking(booking) && booking.notes && (
            <View style={styles.notesContainer}>
              <Feather name="message-circle" size={14} color={theme.textSecondary} />
              <ThemedText
                style={[styles.notesText, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                「{booking.notes}」
              </ThemedText>
            </View>
          )}
        </View>

        {onPress && <Feather name="chevron-right" size={22} color={theme.textSecondary} />}
      </View>

      {/* Review Button (User mode, completed bookings) */}
      {isUserBooking(booking) &&
        !booking.hasReview &&
        onReviewPress && (
          <Pressable
            style={[styles.reviewButton, { borderColor: theme.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              onReviewPress();
            }}
          >
            <ThemedText style={[styles.reviewButtonText, { color: theme.primary }]}>
              レビュー
            </ThemedText>
          </Pressable>
        )}

      {/* Actions (Teacher mode, pending bookings) */}
      {isTeacherMode && isPending && onApprove && onReject && (
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.rejectButton,
              {
                backgroundColor: theme.backgroundRoot,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={isProcessing}
          >
            <Feather name="x" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.rejectButtonText, { color: theme.textSecondary }]}>
              お断りする
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.approveButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed || isProcessing ? 0.8 : 1,
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            disabled={isProcessing}
          >
            <Feather name="check-circle" size={18} color="#ffffff" />
            <ThemedText style={styles.approveButtonText}>リクエストを承認</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Status Badges (Teacher mode) */}
      {!isUserBooking(booking) && (
        <>
          {booking.status === BOOKING_STATUS.CONFIRMED && (
            <View style={[styles.statusBadge, { backgroundColor: '#10B98115' }]}>
              <ThemedText style={[styles.statusText, { color: '#10B981' }]}>
                ✓ 承認済み
              </ThemedText>
            </View>
          )}

          {booking.status === BOOKING_STATUS.COMPLETED && !booking.hasReview && (
            <View style={[styles.statusBadge, { backgroundColor: '#6366F115' }]}>
              <ThemedText style={[styles.statusText, { color: '#6366F1' }]}>
                授業完了（レビュー待ち）
              </ThemedText>
            </View>
          )}

          {booking.status === BOOKING_STATUS.CANCELLED && (
            <View style={[styles.statusBadge, { backgroundColor: '#EF444415' }]}>
              <ThemedText style={[styles.statusText, { color: '#EF4444' }]}>
                お断り済み
                {booking.cancelReason && ` - ${booking.cancelReason}`}
              </ThemedText>
            </View>
          )}

          {/* View Student Details Button (Teacher mode) */}
          {onViewStudentDetails && (
            <Pressable
              style={[styles.viewDetailsButton, { borderColor: theme.border }]}
              onPress={(e) => {
                e.stopPropagation();
                onViewStudentDetails();
              }}
            >
              <Feather name="user" size={16} color={theme.primary} />
              <ThemedText style={[styles.viewDetailsText, { color: theme.primary }]}>
                生徒詳細を見る
              </ThemedText>
            </Pressable>
          )}

          {/* Review Display (Teacher mode, reviewed bookings) */}
          {booking.hasReview && booking.review && (
            <View style={[styles.reviewContainer, { backgroundColor: theme.backgroundRoot }]}>
              <View style={styles.reviewHeader}>
                <ThemedText style={[styles.reviewLabel, { color: theme.textSecondary }]}>
                  レビュー
                </ThemedText>
                <View style={styles.ratingContainer}>
                  <Feather name="star" size={16} color="#F59E0B" />
                  <ThemedText style={[styles.ratingText, { color: theme.text }]}>
                    {booking.review.rating}
                  </ThemedText>
                </View>
              </View>
              {booking.review.content && (
                <ThemedText style={[styles.reviewContent, { color: theme.textSecondary }]}>
                  {booking.review.content}
                </ThemedText>
              )}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 13,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#16a34a',
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 14,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reviewButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  approveButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewContent: {
    fontSize: 13,
    lineHeight: 20,
  },
});
