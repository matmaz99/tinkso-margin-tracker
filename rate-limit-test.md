# Claude API Rate Limiting Solution

## Token Usage Analysis

Based on our implementation analysis:

### **Estimated Token Usage per Invoice:**
- **Input Tokens**: ~16,000-25,000 per invoice
  - System prompt: ~500 tokens
  - Project context: ~50-200 tokens  
  - PDF document: ~15,000-25,000 tokens (major factor)
- **Output Tokens**: ~500-1,500 tokens
- **Total**: ~16,500-26,500 tokens per invoice

### **Claude API Rate Limits:**
- **80,000 input tokens per minute**
- **Calculated capacity**: ~3-4 invoices per minute
- **Target**: 1 invoice every 15 seconds (4 per minute max)

## Solutions Implemented

### 1. **Rate Limiting Queue System** ✅
```typescript
class RateLimitQueue {
  private readonly minDelay = 15000 // 15 seconds between calls
}
```
- Global queue ensures only 1 API call every 15 seconds
- Automatic queuing with wait times logged
- Prevents simultaneous API calls

### 2. **Staggered Processing During Sync** ✅
```typescript
const processingDelay = (created * 15000) + Math.random() * 3000
```
- Each new invoice gets increasing delay: 15s, 30s, 45s, etc.
- Random 0-3s added to prevent exact timing conflicts
- Processes in background without blocking sync

### 3. **Enhanced Error Handling** ✅
```typescript
if (response.status === 429) {
  throw new Error(`Claude API rate limit exceeded (429). Please try again in a few minutes.`)
}
```
- Specific 429 error detection and messaging
- Better user feedback on rate limiting issues

### 4. **Token Usage Monitoring** ✅
```typescript
if (result.usage) {
  console.log(`📊 Token usage - Input: ${result.usage.input_tokens}, Output: ${result.usage.output_tokens}`)
}
```
- Real-time token usage logging
- Helps monitor actual vs estimated usage

## Expected Behavior

### **During Qonto Sync:**
```
🤖 Scheduling vision analysis for "Supplier A" (delay: 15s)
🤖 Scheduling vision analysis for "Supplier B" (delay: 30s) 
🤖 Scheduling vision analysis for "Supplier C" (delay: 45s)
⏱️ Rate limiting: waiting 12s before next Claude API call (queue: 2)
📊 Token usage - Input: 18,450, Output: 850, Total: 19,300
✅ Successfully auto-assigned invoice from "Supplier A" (€2,500) to project "Website Redesign"
```

### **Manual Processing:**
- Single invoices process immediately via queue
- Queue automatically handles timing between requests
- No user-visible delays for individual requests

## Testing Recommendations

1. **Small Batch Test**: Sync 2-3 supplier invoices first
2. **Monitor Logs**: Check for token usage and timing logs
3. **Verify Auto-Assignment**: Confirm high-confidence matches (≥80%) are assigned
4. **Check Rate Limiting**: Ensure no 429 errors in logs

## Fallback Strategy

If rate limiting still occurs:
- Increase `minDelay` from 15s to 20s or 30s
- Reduce `max_tokens` from 4000 to 3000
- Process only business hours to spread load