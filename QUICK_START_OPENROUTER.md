# Quick Start: Switch to OpenRouter

## 3 Simple Steps to Start Using OpenRouter

### Step 1: Get Your OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to https://openrouter.ai/keys
4. Click "Create Key"
5. Copy your API key

### Step 2: Update Your `.env` File

Open `backend/.env` and update these lines:

```bash
# Change this from "gemini" to "openrouter"
AI_PROVIDER=openrouter

# Add your OpenRouter API key here
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

# Optional: Change the model (default is auto)
OPENROUTER_MODEL=openrouter/auto
```

### Step 3: Restart Your Server

```bash
cd backend
uvicorn app.main:app --reload
```

## That's It! 🎉

Your teacher tools (Lesson Planner, Assignment Generator, Rubric Builder) will now use OpenRouter instead of Gemini.

## Test It Works

### Option 1: Use the Web Interface
1. Log in as a teacher
2. Go to Teacher Tools → Lesson Planner
3. Fill in the form and click "Generate"
4. You should see the lesson plan being generated

### Option 2: Run the Test Script
```bash
cd backend
python test_ai_integration.py
```

You should see:
```
Testing AI service integration...
Current AI provider: openrouter
OpenRouter API key configured: Yes
✓ Successfully initialized AI service
  Service type: OpenRouterService
  Model: openrouter/auto
...
AI SERVICE INTEGRATION TEST PASSED!
```

## Switch Back to Gemini Anytime

Just change one line in `backend/.env`:

```bash
AI_PROVIDER=gemini
```

Then restart the server.

## Troubleshooting

### Error: "OPENROUTER_API_KEY is not configured"
- Make sure you added your API key to `.env`
- Make sure there are no extra spaces
- Restart the server after changing `.env`

### Error: "Unsupported AI provider"
- Check that `AI_PROVIDER` is set to either "gemini" or "openrouter"
- Check for typos (it's case-insensitive but must be spelled correctly)

### No response or timeout
- Check your internet connection
- Verify your API key is valid at https://openrouter.ai/keys
- Check if you have credits in your OpenRouter account

### Error: "429 Too Many Requests"
- Free models have strict rate limits
- Wait a few minutes before trying again
- Consider adding credits to your account for higher limits
- Try a different free model

## Available Models

### Free Models (No Credits Required)

OpenRouter offers free models with rate limits. Add `:free` suffix to model names:

**Free Options:**
- `google/gemini-2.0-flash-exp:free` - Gemini 2.0 Flash (free tier)
- `deepseek/deepseek-r1:free` - DeepSeek R1 (free tier)
- `meta-llama/llama-3.2-3b-instruct:free` - Llama 3.2 3B (free tier)
- `google/gemma-2-9b-it:free` - Gemma 2 9B (free tier)

**Note:** Free models have strict rate limits. If you get 429 errors, wait a few minutes or add credits.

### Paid Models (Require Credits)

- `openrouter/auto` - Auto-select best model (requires credits)
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `google/gemini-pro-1.5` - Gemini Pro 1.5
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B

See all models at: https://openrouter.ai/models

## Cost Information

OpenRouter charges per token used. Costs vary by model:
- Auto model selection optimizes for quality and cost
- Check current pricing at: https://openrouter.ai/docs#models
- Monitor usage in your OpenRouter dashboard

## Need Help?

- Read the full documentation: `AI_PROVIDER_INTEGRATION.md`
- Check the summary: `OPENROUTER_INTEGRATION_SUMMARY.md`
- Run the test script: `python test_ai_integration.py`

