# AI Lesson Plan Generator

## Overview
The AI Lesson Plan Generator is the first fully functional tool in the Teacher Tools section. It uses Google's Gemini AI to create comprehensive, pedagogically sound lesson plans based on teacher input.

## Features

### Real-Time Streaming
- **Progressive Display**: The AI-generated lesson plan appears character by character as it's being created
- **Live Feedback**: Teachers can see the plan being generated in real-time
- **Smooth Experience**: No waiting for the entire plan to complete before seeing results

### Comprehensive Input Options
Teachers can specify:
- **Subject**: The subject area (e.g., Mathematics, Science, English)
- **Grade Level**: Target grade level (e.g., Grade 5, 10th Grade)
- **Topic**: Specific lesson topic
- **Duration**: Lesson length in minutes (15-240 minutes)
- **Learning Objectives**: Clear, measurable objectives for the lesson
- **Educational Standards** (Optional): Standards to align with (e.g., Common Core)
- **Additional Context** (Optional): Special requirements, student background, etc.

### Generated Lesson Plan Structure
The AI generates a detailed lesson plan including:

1. **Lesson Overview**
   - Brief summary
   - Key concepts
   - Prerequisites

2. **Learning Objectives**
   - Clear, measurable objectives
   - Standards alignment

3. **Materials and Resources**
   - Required materials
   - Technology needs
   - Reference materials

4. **Lesson Structure**
   - Introduction/Hook
   - Main Instruction (step-by-step)
   - Guided Practice
   - Independent Practice
   - Closure/Summary

5. **Assessment**
   - Formative assessment strategies
   - Summative assessment
   - Success criteria

6. **Differentiation**
   - Strategies for struggling learners
   - Extensions for advanced students
   - Special needs accommodations
   - ELL support

7. **Homework/Extension Activities**
   - Practice activities
   - Real-world applications

8. **Teacher Notes and Tips**
   - Common difficulties
   - Pacing suggestions
   - Alternative approaches

### Output Actions
- **Copy to Clipboard**: One-click copy of the entire lesson plan
- **Download**: Save as a text file for offline use
- **Reset**: Clear form and start fresh

## Technical Implementation

### Backend

#### API Endpoint
- **URL**: `/api/v1/teacher/tools/lesson-planner/generate`
- **Method**: POST
- **Authentication**: Required (Teachers only)
- **Response Type**: Streaming text/plain

#### Request Schema
```json
{
  "subject": "Mathematics",
  "grade_level": "Grade 5",
  "topic": "Introduction to Fractions",
  "duration": 45,
  "learning_objectives": "Students will be able to:\n- Understand what fractions represent\n- Identify numerator and denominator",
  "additional_context": "Students have basic understanding of division",
  "standards": "CCSS.MATH.CONTENT.5.NF.A.1"
}
```

#### Gemini Integration
- **Model**: gemini-2.0-flash-exp
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 4096
- **Streaming**: Enabled for real-time response

#### Service Layer
- **File**: `backend/app/services/gemini_service.py`
- **Class**: `GeminiService`
- **Method**: `generate_lesson_plan_stream()`

### Frontend

#### Page Component
- **File**: `frontend/src/pages/teachers/TeacherLessonPlannerPage.tsx`
- **Route**: `/:schoolCode/teacher/tools/lesson-planner`
- **Access**: Teachers only

#### Service Layer
- **File**: `frontend/src/services/lessonPlannerService.ts`
- **Class**: `LessonPlannerService`
- **Method**: `generateLessonPlanStream()`

#### Streaming Implementation
Uses the Fetch API with ReadableStream for efficient streaming:
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  onChunk(chunk);
}
```

## User Interface

### Layout
- **Two-Column Design**: Input form on left, output on right
- **Responsive**: Stacks vertically on mobile devices
- **Clean & Modern**: Professional appearance suitable for educators

### Input Form
- **Validation**: Real-time validation with error messages
- **Required Fields**: Clearly marked with asterisks
- **Helpful Placeholders**: Examples for each field
- **Character Limits**: Prevents overly long inputs

### Output Display
- **Streaming Indicator**: Animated cursor during generation
- **Formatted Text**: Preserves line breaks and formatting
- **Scrollable**: Fixed height with scroll for long plans
- **Action Buttons**: Copy and download options

### Visual Feedback
- **Loading State**: Spinning icon and "Generating..." text
- **Success Toast**: Confirmation when plan is complete
- **Error Handling**: Clear error messages if generation fails
- **Empty State**: Helpful message when no plan is generated

## Security & Access Control

### Authentication
- JWT token required
- Teachers only (enforced at API level)
- School context validated

### Rate Limiting
- Consider implementing rate limiting to prevent abuse
- Monitor API usage and costs

### Data Privacy
- Lesson plans are not stored by default
- No student data is sent to the AI
- Teachers responsible for saving their own plans

## Performance

### Streaming Benefits
- **Perceived Performance**: Users see results immediately
- **Reduced Wait Time**: No need to wait for entire generation
- **Better UX**: More engaging and interactive

### Optimization
- Efficient text decoding
- Minimal re-renders during streaming
- Debounced state updates

## Future Enhancements

### Planned Features
1. **Save Lesson Plans**: Store plans in the database
2. **Template Library**: Pre-made templates for common topics
3. **Collaboration**: Share plans with other teachers
4. **Version History**: Track changes to saved plans
5. **Export Formats**: PDF, Word, Google Docs
6. **AI Refinement**: Ask AI to modify specific sections
7. **Multi-Language**: Generate plans in different languages
8. **Curriculum Alignment**: Auto-suggest standards based on topic

### Integration Opportunities
- Link to Materials section for resource attachment
- Connect with Calendar for scheduling
- Integration with Grade Book for assessment tracking
- Student portal preview of lesson objectives

## Usage Guidelines

### Best Practices
1. **Be Specific**: Provide detailed learning objectives
2. **Add Context**: Include student background and needs
3. **Review & Edit**: Always review AI-generated content
4. **Customize**: Adapt the plan to your teaching style
5. **Save Externally**: Download or copy important plans

### Tips for Better Results
- Include specific examples in objectives
- Mention any constraints (time, resources)
- Specify differentiation needs upfront
- Reference relevant standards
- Provide context about student abilities

## Troubleshooting

### Common Issues

**Streaming Not Working**
- Check network connection
- Verify authentication token
- Check browser console for errors

**Generation Fails**
- Verify all required fields are filled
- Check field length limits
- Ensure API key is configured

**Slow Generation**
- Normal for complex topics
- Depends on AI model load
- Consider shorter duration lessons

**Empty Response**
- Check backend logs
- Verify Gemini API key
- Check API quota/limits

## API Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
```

### Health Check
- **Endpoint**: `/api/v1/teacher/tools/lesson-planner/health`
- **Method**: GET
- **Response**: Service status and model information

## Testing

### Manual Testing Checklist
- [ ] Form validation works correctly
- [ ] Streaming displays progressively
- [ ] Copy to clipboard functions
- [ ] Download saves correct file
- [ ] Reset clears all fields
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Dark mode compatible

### Test Cases
1. Generate plan with all fields
2. Generate plan with only required fields
3. Test with very long objectives
4. Test with special characters
5. Test network interruption
6. Test concurrent generations

## Monitoring

### Metrics to Track
- Generation success rate
- Average generation time
- User engagement (plans generated per teacher)
- Error rates
- API costs

### Logging
- All generations logged with user ID
- Errors logged with full context
- Performance metrics tracked

## Cost Considerations

### Gemini API Pricing
- Monitor token usage
- Set up billing alerts
- Consider caching common requests
- Implement usage quotas per teacher

## Support

### User Documentation
- In-app tooltips and help text
- Video tutorial (planned)
- FAQ section (planned)
- Teacher training materials

### Technical Support
- Check backend logs for errors
- Review Gemini API status
- Verify environment configuration
- Contact development team for issues

