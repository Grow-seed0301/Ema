# Error Logging Implementation

## Overview

This implementation adds comprehensive error logging functionality to the backend application. When exceptions occur, they are automatically stored in the `error_logs` database table for later analysis and debugging.

## Database Schema

### error_logs Table

The `error_logs` table stores all exceptions and errors that occur in the application:

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| error_message | text | The error message |
| error_stack | text | Stack trace (if available) |
| error_code | varchar | Error code for categorization |
| status_code | integer | HTTP status code |
| method | varchar | HTTP method (GET, POST, etc.) |
| url | varchar | Request URL |
| user_id | varchar | ID of the user (if authenticated) |
| user_type | varchar | Type of user (student, teacher, admin) |
| metadata | jsonb | Additional context data (request body, query params, etc.) |
| created_at | timestamp | When the error occurred |

## Implementation

### 1. Error Logging Middleware

The global error logging middleware (`errorLoggingMiddleware`) is added to the Express app in `server/index.ts`. It automatically catches all unhandled errors and logs them to the database.

```typescript
import { errorLoggingMiddleware } from "./utils/errorLogger";

// Error logging middleware - logs errors to database
app.use(errorLoggingMiddleware);
```

### 2. Manual Error Logging

You can also manually log errors in your route handlers using the `logErrorToDatabase` function:

```typescript
import { logErrorToDatabase } from "../../utils/errorLogger";

try {
  // Your code here
} catch (error) {
  console.error("Error occurred:", error);
  
  // Log error to database
  await logErrorToDatabase(error as Error, req, {
    errorCode: "CUSTOM_ERROR_CODE",
    statusCode: 500,
    userId: req.session?.userId,
    userType: "student",
  });
  
  sendError(res, "Operation failed", "ERROR_CODE", 500);
}
```

### 3. Error Logging Function

The `logErrorToDatabase` function accepts:

- **error**: An Error object or string message
- **req** (optional): Express Request object for context
- **additionalData** (optional): Additional error metadata

Example:

```typescript
await logErrorToDatabase(
  new Error("Payment processing failed"),
  req,
  {
    errorCode: "PAYMENT_FAILED",
    statusCode: 500,
    userId: user.id,
    userType: "student",
    metadata: {
      paymentId: payment.id,
      amount: payment.amount,
    },
  }
);
```

## Benefits

1. **Centralized Error Tracking**: All errors are stored in one place for easy monitoring
2. **Context Preservation**: Errors include request details, user information, and custom metadata
3. **Debugging**: Stack traces help identify the source of errors
4. **Analysis**: Query the error_logs table to identify patterns and frequent issues
5. **Monitoring**: Can be integrated with alerting systems to notify admins of critical errors

## Example Queries

### Get recent errors:
```sql
SELECT * FROM error_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Find errors by status code:
```sql
SELECT * FROM error_logs 
WHERE status_code >= 500 
ORDER BY created_at DESC;
```

### Find errors for a specific user:
```sql
SELECT * FROM error_logs 
WHERE user_id = 'specific-user-id' 
ORDER BY created_at DESC;
```

### Count errors by code:
```sql
SELECT error_code, COUNT(*) as count 
FROM error_logs 
GROUP BY error_code 
ORDER BY count DESC;
```

## Future Enhancements

Potential improvements to consider:

1. **Admin Dashboard**: Create an admin interface to view and analyze error logs
2. **Email Alerts**: Send notifications when critical errors occur
3. **Error Aggregation**: Group similar errors to reduce noise
4. **Auto-cleanup**: Automatically archive or delete old error logs
5. **Error Analytics**: Add charts and statistics for error trends
6. **Integration**: Connect with external monitoring services (e.g., Sentry, Rollbar)

## Testing

To test the error logging functionality:

1. Run the test script:
```bash
cd backend
npm run dev
# In another terminal:
tsx server/test-error-logging.ts
```

2. Check the `error_logs` table in your database to verify errors were logged

3. Trigger an error in the application and verify it appears in the error logs
