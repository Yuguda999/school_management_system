# Toast Notifications System

This document explains how to use the new toast notification system that replaces all `alert()` calls throughout the application.

## Overview

The toast notification system provides a modern, user-friendly way to display messages to users. It includes:

- **Success notifications** - For successful operations
- **Error notifications** - For errors and failures
- **Warning notifications** - For warnings and cautions
- **Info notifications** - For informational messages

## Setup

The toast system is already set up globally in the application:

1. **ToastProvider** is wrapped around the entire app in `main.tsx`
2. **Global notification handler** is registered automatically
3. **useToast hook** is available in all components

## Usage

### Method 1: Using the useToast Hook (Recommended)

```typescript
import { useToast } from '../../hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!', 'Success!');
    } catch (error) {
      showError('Failed to save data. Please try again.', 'Save Failed');
    }
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
};
```

### Method 2: Using Global Notification Functions

```typescript
import { alertSuccess, alertError, alertWarning, alertInfo } from '../../utils/notifications';

// These can be used anywhere, even outside React components
const handleApiCall = async () => {
  try {
    await apiCall();
    alertSuccess('Operation completed successfully!');
  } catch (error) {
    alertError('Operation failed. Please try again.');
  }
};
```

## Toast Types and When to Use Them

### Success Toasts
Use for successful operations:
```typescript
showSuccess('Class created successfully!', 'Class Created!');
showSuccess('Student updated successfully!', 'Student Updated!');
showSuccess('Data exported successfully!', 'Export Complete!');
```

### Error Toasts
Use for errors and failures:
```typescript
showError('Failed to save data. Please try again.', 'Save Failed');
showError('Network connection error.', 'Connection Error');
showError('Invalid email format.', 'Validation Error');
```

### Warning Toasts
Use for warnings and cautions:
```typescript
showWarning('Please select at least one item.', 'No Selection');
showWarning('This action cannot be undone.', 'Warning');
showWarning('Session will expire in 5 minutes.', 'Session Warning');
```

### Info Toasts
Use for informational messages:
```typescript
showInfo('Loading data...', 'Please wait');
showInfo('New features available!', 'Update Available');
showInfo('Backup completed.', 'System Info');
```

## Best Practices

### 1. Message Content
- **Be specific**: "Class 'Math 101' created successfully" vs "Success"
- **Be helpful**: Include next steps or context when appropriate
- **Be concise**: Keep messages short but informative

### 2. Titles
- **Success**: "Created!", "Updated!", "Deleted!", "Complete!"
- **Error**: "Failed", "Error", "Connection Error", "Validation Error"
- **Warning**: "Warning", "Caution", "Attention Required"
- **Info**: "Info", "Please wait", "Update Available"

### 3. Error Handling
Always provide meaningful error messages:
```typescript
try {
  await operation();
  showSuccess('Operation completed successfully!');
} catch (error: any) {
  const errorMessage = error.response?.data?.detail || 'Operation failed. Please try again.';
  showError(errorMessage, 'Operation Failed');
}
```

### 4. Loading States
Show info toasts for long-running operations:
```typescript
const handleBulkOperation = async () => {
  showInfo('Processing bulk operation...', 'Please wait');
  try {
    await bulkOperation();
    showSuccess('Bulk operation completed successfully!');
  } catch (error) {
    showError('Bulk operation failed.', 'Error');
  }
};
```

## Migration from alert()

### Before (Old)
```typescript
// ❌ Don't use alert()
alert('Data saved successfully!');
alert('Error: Failed to save data');
```

### After (New)
```typescript
// ✅ Use toast notifications
showSuccess('Data saved successfully!', 'Success!');
showError('Failed to save data. Please try again.', 'Save Failed');
```

## Examples from the Codebase

### Class Management (ClassesPage.tsx)
```typescript
const handleCreateClass = async (classData: CreateClassForm) => {
  try {
    showInfo('Creating class...', 'Please wait');
    const newClass = await academicService.createClass(classData);
    showSuccess(
      `Class "${newClass.name}" has been created successfully and is now available for student enrollment.`,
      'Class Created!'
    );
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Failed to create class. Please try again.';
    showError(errorMessage, 'Creation Failed');
  }
};
```

### Student Management (StudentsPage.tsx)
```typescript
const handleDeleteStudent = async (studentId: string) => {
  if (window.confirm('Are you sure you want to delete this student?')) {
    try {
      showInfo('Deleting student...', 'Please wait');
      await studentService.deleteStudent(studentId);
      showSuccess('Student has been successfully deleted.', 'Student Deleted!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete student. Please try again.';
      showError(errorMessage, 'Delete Failed');
    }
  }
};
```

## Customization

The toast component supports customization:
- **Auto-close**: Toasts automatically disappear after 5 seconds
- **Manual close**: Users can close toasts manually
- **Dark mode**: Toasts adapt to the current theme
- **Positioning**: Fixed to top-right corner
- **Animation**: Smooth slide-in animation

## Accessibility

The toast system is fully accessible:
- **Screen reader support**: Proper ARIA labels
- **Keyboard navigation**: Can be closed with keyboard
- **High contrast**: Works with high contrast themes
- **Focus management**: Doesn't interfere with focus flow

## Troubleshooting

### Toast not showing
1. Ensure `ToastProvider` is wrapped around your app
2. Check that you're using the hook inside a React component
3. Verify the component is mounted when calling the toast

### Multiple toasts
The system shows one toast at a time. New toasts replace existing ones.

### Styling issues
Toasts use Tailwind CSS classes and adapt to the current theme automatically.
