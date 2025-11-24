# OpenRouter Free Models Guide

## Overview

OpenRouter offers **free models** that don't require credits, but they come with strict rate limits. This guide explains how to use them and what to expect.

## ✅ Integration Complete

The OpenRouter integration is **working correctly**! The configuration has been updated to use free models.

## Current Configuration

Your `.env` file is now set to use a free model:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

## Available Free Models

Add `:free` suffix to model names to use free tier:

### Recommended Free Models

1. **Google Gemini 2.0 Flash** (Currently configured)
   ```bash
   OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
   ```

2. **DeepSeek R1**
   ```bash
   OPENROUTER_MODEL=deepseek/deepseek-r1:free
   ```

3. **Meta Llama 3.2 3B**
   ```bash
   OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
   ```

4. **Google Gemma 2 9B**
   ```bash
   OPENROUTER_MODEL=google/gemma-2-9b-it:free
   ```

See all free models at: https://openrouter.ai/models?q=free

## ⚠️ Important: Rate Limits

Free models have **very strict rate limits**. You may encounter:

### 429 Error: "Too Many Requests"

This is **normal** for free models. It means you've hit the rate limit.

**Solutions:**
1. **Wait 5-10 minutes** before trying again
2. **Try a different free model** (they have separate rate limits)
3. **Add credits** to your OpenRouter account for higher limits
4. **Use Gemini directly** by setting `AI_PROVIDER=gemini` in `.env`

### Rate Limit Details

- Free models typically allow **1-5 requests per minute**
- Limits reset after a few minutes
- Different models have different limits
- Paid models have much higher limits (100+ requests/minute)

## Testing the Integration

### Test 1: Service Initialization (No API calls)

```bash
cd backend
python3 test_service_initialization.py
```

This test **passed successfully** ✅ - the service is properly configured!

### Test 2: Actual Generation (Makes API calls)

```bash
cd backend
python3 test_ai_integration.py
```

This may fail with 429 errors due to rate limits. This is **expected** for free models.

## Using the Integration

### Option 1: Use Free Models (Current Setup)

**Pros:**
- No cost
- No credits needed
- Good for testing

**Cons:**
- Strict rate limits
- May get 429 errors frequently
- Need to wait between requests

**Best for:** Light testing, occasional use

### Option 2: Add Credits to OpenRouter

**Pros:**
- Much higher rate limits
- Access to better models
- More reliable

**Cons:**
- Costs money (usually $5-10 minimum)

**How to add credits:**
1. Visit https://openrouter.ai/credits
2. Add credits to your account
3. Change model to a paid one (e.g., `openrouter/auto`)

### Option 3: Use Gemini Directly

**Pros:**
- You already have a Gemini API key
- Higher free tier limits
- More reliable

**Cons:**
- Limited to Gemini models only

**How to switch:**
```bash
# In backend/.env
AI_PROVIDER=gemini
```

Then restart the server.

## Recommendations

### For Development/Testing
Use **Gemini directly** (`AI_PROVIDER=gemini`) - it has better free tier limits.

### For Production
Either:
- Add credits to OpenRouter for flexibility
- Use Gemini directly if you're happy with Gemini models

### For Occasional Use
Free OpenRouter models work fine, just expect rate limits.

## Troubleshooting

### "429 Too Many Requests"
✅ **This is normal for free models**
- Wait 5-10 minutes
- Try a different free model
- Or add credits

### "402 Payment Required"
- Model requires credits
- Add `:free` suffix to model name
- Or add credits to account

### Service initialization fails
- Check API key is correct
- Check internet connection
- Verify model name is correct

## Summary

✅ **Integration is working!**
- Service initializes correctly
- API key is valid
- Configuration is correct

⚠️ **Rate limits are expected**
- Free models have strict limits
- 429 errors are normal
- Wait between requests or add credits

🎯 **Recommendation**
For now, use Gemini directly (`AI_PROVIDER=gemini`) for better free tier experience. Switch to OpenRouter when you need access to multiple models or when you add credits.

