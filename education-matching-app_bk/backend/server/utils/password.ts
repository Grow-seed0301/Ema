export function stripPassword<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function stripPasswordsFromUsers<T extends { password?: string | null }>(users: T[]): Omit<T, 'password'>[] {
  return users.map(stripPassword);
}

export function stripPasswordsFromBookings<T extends { student?: { password?: string | null } | null; teacher?: { password?: string | null } | null }>(
  bookings: T[]
): T[] {
  return bookings.map((booking) => ({
    ...booking,
    student: booking.student ? stripPassword(booking.student) : null,
    teacher: booking.teacher ? stripPassword(booking.teacher) : null,
  }));
}

export function stripPasswordsFromPayments<T extends { user?: { password?: string | null } | null }>(
  payments: T[]
): T[] {
  return payments.map((payment) => ({
    ...payment,
    user: payment.user ? stripPassword(payment.user) : null,
  }));
}
