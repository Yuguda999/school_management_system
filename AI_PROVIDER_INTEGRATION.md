# AI Provider Integration - Gemini & OpenRouter

This document describes the AI provider integration that allows switching between Google Gemini and OpenRouter for AI-powered teacher tools.

## Overview

The school management system now supports two AI providers:
- **Google Gemini** - Direct integration with Google's Gemini AI
- **OpenRouter** - Integration with OpenRouter's unified AI API (supports multiple models including auto-routing)

## Features

### Supported AI Features
Both providers support the following teacher tools:
- **Lesson Plan Generator** - Generate comprehensive lesson plans
- **Assignment Generator** - Create detailed assignments
- **Rubric Builder** - Build grading rubrics

### Provider-Specific Features

#### Google Gemini
- ✅ Native file upload support (PDFs, documents, images, presentations)
- ✅ Files are uploaded to Gemini Files API
- ✅ Automatic file cleanup after generation
- ✅ Direct streaming support

#### OpenRouter
- ✅ Auto model selection (intelligent routing to best model)
- ✅ Support for multiple AI models
- ✅ File content can be included in prompts (no native file upload)
- ✅ Streaming support via Server-Sent Events

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# AI Configuration
# Options: "gemini" or "openrouter"
AI_PROVIDER=gemini

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# OpenRouter Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here
# Default model for OpenRouter (openrouter/auto uses intelligent routing)
OPENROUTER_MODEL=openrouter/auto
```

### Switching Providers

To switch between providers, simply change the `AI_PROVIDER` environment variable:

**Use Gemini:**
```bash
AI_PROVIDER=gemini
```

**Use OpenRouter:**
```bash
AI_PROVIDER=openrouter
```

Then restart your application.

## Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file as `GEMINI_API_KEY`

### OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key and add it to your `.env` file as `OPENROUTER_API_KEY`

## OpenRouter Models

OpenRouter supports many models, including free and paid options.

### Free Models (No Credits Required)

Free models are available with rate limits. Add `:free` suffix to model names:

```bash
# Examples of free models
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_MODEL=deepseek/deepseek-r1:free
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_MODEL=google/gemma-2-9b-it:free
```

**Important:** Free models have strict rate limits. If you encounter 429 errors, wait a few minutes or consider adding credits.

### Paid Models (Require Credits)

Paid models offer higher rate limits and better performance:

- `openrouter/auto` - Auto model selection (uses NotDiamond's intelligent routing)
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `google/gemini-pro-1.5` - Gemini Pro 1.5
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B
- And many more...

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

## Architecture

### Service Structure

```
app/services/
├── ai_service_base.py          # Abstract base class for AI services
├── gemini_service.py            # Gemini implementation
├── openrouter_service.py        # OpenRouter implementation
└── ai_service_factory.py        # Factory for creating AI service instances
```

### How It Works

1. **Abstract Base Class** (`AIServiceBase`): Defines the interface all AI services must implement
2. **Service Implementations**: Both `GeminiService` and `OpenRouterService` inherit from `AIServiceBase`
3. **Factory Pattern**: `get_ai_service()` returns the appropriate service based on configuration
4. **Unified API**: All endpoints use `get_ai_service()` to get the configured provider

## Testing

Run the test script to verify the integration:

```bash
cd backend
python test_ai_integration.py
```

This will:
- Check which provider is configured
- Verify API keys are set
- Test lesson plan generation
- Display the first few chunks of generated content

## File Upload Handling

### Gemini
Files are uploaded to Gemini Files API and referenced in prompts. Files are automatically deleted after generation.

### OpenRouter
OpenRouter doesn't support file uploads like Gemini. The `upload_file()` method returns the file path for compatibility, but files are not actually uploaded. In the future, file content could be read and included in the prompt text.

## API Endpoints

All teacher tools endpoints remain the same:
- `POST /api/v1/teacher-tools/lesson-planner/generate`
- `POST /api/v1/teacher-tools/assignment-generator/generate`
- `POST /api/v1/teacher-tools/rubric-builder/generate`
- `GET /api/v1/teacher-tools/lesson-planner/health`
- `GET /api/v1/teacher-tools/assignment-generator/health`
- `GET /api/v1/teacher-tools/rubric-builder/health`

The health check endpoints now return the current model being used.

## Cost Considerations

### Gemini
- Free tier available with rate limits
- Pay-as-you-go pricing for higher usage
- See [Gemini Pricing](https://ai.google.dev/pricing)

### OpenRouter
- Pay-per-use based on the model selected
- Auto model selection optimizes for cost and quality
- See [OpenRouter Pricing](https://openrouter.ai/docs#models)

## Troubleshooting

### "AI provider not configured" error
- Check that `AI_PROVIDER` is set to either "gemini" or "openrouter"
- Verify the corresponding API key is set

### "API key not configured" error
- Ensure the API key for your selected provider is set in `.env`
- Restart the application after changing environment variables

### Streaming not working
- Both providers support streaming
- Check network connectivity
- Verify API key has proper permissions

## Future Enhancements

Potential improvements:
- Support for additional AI providers (Anthropic, OpenAI, etc.)
- File content extraction for OpenRouter (read PDFs/docs and include in prompt)
- Provider-specific optimizations
- Fallback to secondary provider if primary fails
- Cost tracking and usage analytics

