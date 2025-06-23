# Integration Sync Guide

## 🏢 Qonto Integration - Sync Clients

### Option 1: Via Browser (Recommended)
1. **Login to your app**: http://localhost:3000/login
2. **Navigate to Settings**: http://localhost:3000/settings (once we integrate it)
3. **Or use direct API calls** (see Option 2)

### Option 2: Direct API Calls (with authentication)

#### Sync Qonto Clients
```bash
# First login and get session cookie, then:
curl -X POST http://localhost:3000/api/integrations/qonto/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"sync_type": "clients"}'
```

#### Sync Qonto Client Invoices
```bash
curl -X POST http://localhost:3000/api/integrations/qonto/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"sync_type": "client_invoices"}'
```

#### Sync Qonto Supplier Invoices
```bash
curl -X POST http://localhost:3000/api/integrations/qonto/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"sync_type": "supplier_invoices"}'
```

#### Sync All Qonto Data
```bash
curl -X POST http://localhost:3000/api/integrations/qonto/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"sync_type": "all"}'
```

## 📋 ClickUp Integration - Sync Projects

#### Sync ClickUp Projects/Tasks
```bash
curl -X POST http://localhost:3000/api/integrations/clickup/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"force_full_sync": true}'
```

## 📊 Check Integration Status
```bash
curl -X GET http://localhost:3000/api/integrations/status \
  -H "Cookie: [your-session-cookie]"
```

## 🔧 Troubleshooting

### Get Your Session Cookie
1. Open browser dev tools (F12)
2. Go to Application/Storage tab
3. Look for cookies from localhost:3000
4. Copy the session cookie value

### Check Credentials
Make sure your credentials are set in `.env.local`:
```bash
QONTO_API_KEY=tinkso-5576:91ec5b4cfc34b6d2c6f52be50fc56743
CLICKUP_API_TOKEN=pk_2457496_8HDO7D8HEX91LD2UCQJQU8VK7K9FQJTU
CLICKUP_LIST_ID=901511908059
```