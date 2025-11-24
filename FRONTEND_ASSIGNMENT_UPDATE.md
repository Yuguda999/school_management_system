# Frontend Update - Assignment Generator with Number of Questions

## Summary

The frontend has been updated to support the new "Number of Questions" parameter in the Assignment Generator. Users can now specify exactly how many questions they want the AI to generate.

## ✅ Changes Made

### 1. Updated Service Interface

**File:** `frontend/src/services/assignmentGeneratorService.ts`

Added `number_of_questions` to the `AssignmentRequest` interface:

```typescript
export interface AssignmentRequest {
  subject: string;
  grade_level: string;
  topic: string;
  assignment_type: string;
  difficulty_level: string;
  duration: string;
  learning_objectives: string;
  number_of_questions?: number;  // NEW!
  additional_context?: string;
  standards?: string;
  files?: File[];
}
```

Updated the service to send the parameter to the backend:

```typescript
if (request.number_of_questions) {
  formData.append('number_of_questions', request.number_of_questions.toString());
}
```

### 2. Updated Page Component

**File:** `frontend/src/pages/teachers/AssignmentGeneratorPage.tsx`

**Added to interface:**
```typescript
interface AssignmentFormData {
  subject: string;
  grade_level: string;
  topic: string;
  assignment_type: string;
  difficulty_level: string;
  duration: string;
  learning_objectives: string;
  number_of_questions?: number;  // NEW!
  additional_context?: string;
  standards?: string;
}
```

**Added form field:**
- New input field for "Number of Questions"
- Positioned between "Duration/Length" and "Learning Objectives"
- Optional field with validation (min: 1, max: 100)
- Includes helpful description text
- Uses HashtagIcon for visual consistency

### 3. Form Field Details

**Label:** "Number of Questions (Optional)"

**Input Type:** Number

**Validation:**
- Minimum: 1 question
- Maximum: 100 questions
- Optional (not required)

**Placeholder:** "e.g., 10, 15, 20"

**Help Text:** "Specify how many questions to generate (for quizzes, worksheets, etc.)"

**Icon:** HashtagIcon (from Heroicons)

## 🎨 UI/UX Features

### Visual Design
- Consistent with existing form fields
- HashtagIcon on the left for visual clarity
- Gray placeholder text with examples
- Helper text below the input explaining the purpose

### Validation
- Prevents negative numbers
- Prevents unreasonably large numbers (max 100)
- Shows error messages if validation fails
- Optional field - can be left empty

### User Experience
- Clear labeling: "Number of Questions (Optional)"
- Helpful examples in placeholder
- Descriptive help text
- Positioned logically in the form flow

## 📱 How It Looks

```
┌─────────────────────────────────────────────┐
│ Number of Questions (Optional)              │
├─────────────────────────────────────────────┤
│ #  [                    ]                   │
│    e.g., 10, 15, 20                         │
│                                             │
│ Specify how many questions to generate     │
│ (for quizzes, worksheets, etc.)            │
└─────────────────────────────────────────────┘
```

## 🚀 Usage Examples

### Example 1: Math Quiz
```
Subject: Mathematics
Grade Level: Grade 8
Topic: Linear Equations
Assignment Type: Quiz
Difficulty Level: Medium
Duration: 30 minutes
Number of Questions: 10  ← User enters this
Learning Objectives: Solve linear equations...
```

**Result:** AI generates exactly 10 quiz questions with answers.

### Example 2: Science Worksheet
```
Subject: Science
Grade Level: Grade 7
Topic: Photosynthesis
Assignment Type: Worksheet
Difficulty Level: Easy
Duration: 45 minutes
Number of Questions: 15  ← User enters this
Learning Objectives: Understand photosynthesis...
```

**Result:** AI generates exactly 15 practice problems with solutions.

### Example 3: Without Specifying
```
Subject: English
Grade Level: Grade 10
Topic: Shakespeare
Assignment Type: Essay
Difficulty Level: Hard
Duration: 2 weeks
Number of Questions: [empty]  ← User leaves blank
Learning Objectives: Analyze themes...
```

**Result:** AI generates an appropriate number of essay prompts based on the assignment type and duration.

## 🔧 Technical Details

### Form Registration
```typescript
{...register('number_of_questions', { 
  valueAsNumber: true,
  min: { value: 1, message: 'Must be at least 1' },
  max: { value: 100, message: 'Maximum 100 questions' }
})}
```

### Data Flow
1. User enters number in form field
2. React Hook Form validates the input
3. On submit, data is passed to `assignmentGeneratorService`
4. Service converts number to string and adds to FormData
5. FormData is sent to backend API
6. Backend generates specified number of questions

## ✅ Testing Checklist

- [x] Form field renders correctly
- [x] Validation works (min/max)
- [x] Optional field (can be left empty)
- [x] Data is sent to backend correctly
- [x] No TypeScript errors
- [x] Consistent styling with other fields
- [x] Help text is clear and helpful

## 📋 Files Modified

1. **frontend/src/services/assignmentGeneratorService.ts**
   - Added `number_of_questions` to `AssignmentRequest` interface
   - Updated service to send the parameter

2. **frontend/src/pages/teachers/AssignmentGeneratorPage.tsx**
   - Added `number_of_questions` to `AssignmentFormData` interface
   - Imported `HashtagIcon`
   - Added form field with validation

## 🎯 Benefits

1. **User Control** - Teachers specify exactly how many questions they need
2. **Flexibility** - Optional field works for all assignment types
3. **Validation** - Prevents invalid inputs
4. **Clear UI** - Obvious purpose with helpful text
5. **Consistent** - Matches existing form design

## 🔄 Backward Compatibility

The field is **optional**, so:
- Existing workflows continue to work
- Users can choose to use it or not
- Backend handles both cases (with or without the parameter)

## 📝 Next Steps

1. Test the form with different assignment types
2. Verify the generated assignments have the correct number of questions
3. Gather user feedback on the feature
4. Consider adding presets (e.g., "Quick Quiz: 5 questions", "Full Test: 20 questions")

