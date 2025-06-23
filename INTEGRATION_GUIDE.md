# 🔄 Tinkso Margin Tracker - API Integrations Guide

## Overview

The Tinkso Margin Tracker application includes robust integrations with ClickUp (project management) and Qonto (banking/invoices) to automatically sync data and maintain up-to-date financial tracking.

## 🎯 Integration Features

### ✅ ClickUp Integration
- **Purpose**: Sync project data from ClickUp tasks
- **API**: ClickUp API v2
- **Data Flow**: ClickUp Tasks → Supabase Projects table
- **Sync Type**: Incremental (only new/updated items)
- **Authentication**: API Token-based

### ✅ Qonto Integration  
- **Purpose**: Import invoices and client data
- **API**: Qonto Business API (Invoice & Client endpoints)
- **Data Flow**: 
  - Qonto Clients → Supabase Clients table
  - Qonto Client Invoices → Supabase Client Invoices table  
  - Qonto Supplier Invoices → Supabase Supplier Invoices table
- **Sync Type**: Incremental with pagination
- **Authentication**: Login:Secret Key format

## 🚀 API Endpoints

### Integration Status
```
GET /api/integrations/status
POST /api/integrations/status
```

**GET Response:**
```json
{
  "integrations": {
    "clickup": {
      "status": "connected|error|unavailable",
      "last_sync": "2024-12-15T10:30:00Z",
      "error": null,
      "sync_stats": []
    },
    "qonto": {
      "status": "connected|error|unavailable", 
      "last_sync": "2024-12-15T10:30:00Z",
      "error": null,
      "organization": {...},
      "sync_stats": []
    }
  },
  "data_statistics": {
    "projects": 25,
    "supplier_invoices": 150,
    "client_invoices": 80
  },
  "system_status": "operational"
}
```

**POST Actions:**
```json
// Test connections
{"integration": "clickup", "action": "test_connection"}
{"integration": "qonto", "action": "test_connection"}

// Trigger manual sync
{"integration": "clickup", "action": "sync"}
{"integration": "qonto", "action": "sync"}
```

### ClickUp Sync
```
GET /api/integrations/clickup/sync    # Get sync status
POST /api/integrations/clickup/sync   # Trigger sync
```

**POST Request:**
```json
{
  "force_full_sync": false  // Optional: force complete resync
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "uuid",
  "records_processed": 45,
  "records_updated": 12,
  "records_created": 3,
  "sync_type": "incremental",
  "last_sync_time": "2024-12-15T09:00:00Z"
}
```

### Qonto Sync
```
GET /api/integrations/qonto/sync     # Get sync status  
POST /api/integrations/qonto/sync    # Trigger sync
```

**POST Request:**
```json
{
  "force_full_sync": false,           // Optional: force complete resync
  "sync_type": "all"                  // "all", "clients", "client_invoices", "supplier_invoices"
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "uuid",
  "records_processed": 125,
  "records_updated": 45,
  "records_created": 15,
  "sync_type": "incremental",
  "api_type": "all"
}
```

## 🔧 Configuration

### Environment Variables

```bash
# ClickUp Configuration
CLICKUP_API_TOKEN=pk_2457496_8HDO7D8HEX91LD2UCQJQU8VK7K9FQJTU
CLICKUP_LIST_ID=901512074401

# Qonto Configuration  
QONTO_API_KEY=tinkso-5576:91ec5b4cfc34b6d2c6f52be50fc56743
```

### ClickUp Setup
1. Generate API token in ClickUp Settings → Apps → API
2. Find your List ID from the ClickUp URL
3. Configure custom field "Framework-Type" for project classification

### Qonto Setup
1. Get Business API credentials from Qonto dashboard
2. Format as `organization_slug:secret_key`
3. Ensure access to Invoice and Client APIs

## 📊 Data Mapping

### ClickUp → Supabase Projects
```typescript
{
  clickup_id: task.id,
  name: task.name.replace(/^\[Project\]\s*/, ''),
  description: task.description,
  client_name: extracted_from_description,
  status: mapped_status,
  start_date: task.start_date,
  end_date: task.due_date,
  last_sync_at: timestamp,
  sync_status: 'success'
}
```

### Qonto Clients → Supabase Clients
```typescript
{
  qonto_id: client.id,
  name: client.name,
  email: client.email,
  phone: client.phone,
  address: client.address,
  vat_number: client.vat_number,
  country: client.country,
  currency: 'EUR',
  last_sync_at: timestamp,
  is_active: true
}
```

### Qonto Client Invoices → Supabase Client Invoices
```typescript
{
  qonto_id: invoice.id,
  invoice_number: invoice.invoice_number,
  client_id: matched_client_id,
  amount_total: invoice.amount_total_cents / 100,
  amount_net: invoice.amount_net_cents / 100,
  amount_vat: invoice.amount_vat_cents / 100,
  currency: invoice.currency,
  status: invoice.status,
  issue_date: invoice.issue_date,
  due_date: invoice.due_date,
  paid_date: invoice.paid_date,
  description: invoice.description,
  pdf_url: invoice.pdf_url,
  is_auto_detected: true
}
```

### Qonto Supplier Invoices → Supabase Supplier Invoices
```typescript
{
  qonto_id: invoice.id,
  supplier_name: invoice.supplier_name,
  amount_total: invoice.amount_total_cents / 100,
  amount_net: invoice.amount_net_cents / 100,
  amount_vat: invoice.amount_vat_cents / 100,
  currency: invoice.currency,
  invoice_date: invoice.invoice_date,
  description: invoice.description,
  pdf_url: invoice.pdf_url,
  status: 'pending-assignment',
  is_processed: false
}
```

## 🔐 Security Features

### Authentication
- All endpoints require valid user authentication
- Uses Supabase auth middleware
- Session-based access control

### Data Protection
- API keys stored as environment variables
- Secure client creation with error handling
- Connection testing before data operations

### Error Handling
- Comprehensive try/catch blocks
- Detailed error logging in sync logs
- Graceful degradation on API failures
- Rate limiting consideration

## 📈 Monitoring & Logging

### Sync Logs
Both integrations maintain detailed sync logs:

**ClickUp Sync Log:**
```sql
CREATE TABLE clickup_sync_log (
  id UUID PRIMARY KEY,
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  records_processed INTEGER,
  records_created INTEGER,
  records_updated INTEGER,
  error_message TEXT
);
```

**Qonto Sync Log:**
```sql
CREATE TABLE qonto_sync_log (
  id UUID PRIMARY KEY,
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  records_processed INTEGER,
  records_created INTEGER,
  records_updated INTEGER,
  error_message TEXT,
  last_transaction_id TEXT
);
```

### Sync Statistics
- Track success/failure rates
- Monitor data processing volumes
- Identify sync performance trends
- Alert on prolonged failures

## 🧪 Testing

### Manual Testing
```bash
# Test ClickUp connection
curl -X POST http://localhost:3000/api/integrations/status \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session" \
  -d '{"integration": "clickup", "action": "test_connection"}'

# Test Qonto connection  
curl -X POST http://localhost:3000/api/integrations/status \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session" \
  -d '{"integration": "qonto", "action": "test_connection"}'

# Trigger ClickUp sync
curl -X POST http://localhost:3000/api/integrations/clickup/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session" \
  -d '{"force_full_sync": false}'

# Trigger Qonto sync
curl -X POST http://localhost:3000/api/integrations/qonto/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session" \
  -d '{"force_full_sync": false, "sync_type": "all"}'
```

### Automated Testing
Run the verification script:
```bash
node test-integrations.js
```

## 🚀 Usage Workflow

### Initial Setup
1. Configure environment variables
2. Test connections via `/api/integrations/status`
3. Run initial full sync for both integrations
4. Verify data appears in Supabase tables

### Ongoing Operation
1. Schedule regular incremental syncs (recommended: every 30 minutes)
2. Monitor sync logs for errors
3. Use manual sync triggers for immediate updates
4. Review integration status dashboard

### Troubleshooting
1. Check integration status endpoint for connection errors
2. Review sync logs for detailed error messages
3. Verify API credentials and permissions
4. Test individual integration endpoints
5. Check Supabase table data and constraints

## ✅ Implementation Status

**COMPLETED:**
- ✅ ClickUp client with full API methods
- ✅ Qonto client with Business API endpoints
- ✅ ClickUp sync endpoint with incremental support
- ✅ Qonto sync endpoint for invoices and clients
- ✅ Integration status monitoring endpoint
- ✅ Database schema with sync logging
- ✅ TypeScript types and interfaces
- ✅ Authentication middleware integration
- ✅ Error handling and logging
- ✅ Data transformation and mapping
- ✅ Environment configuration
- ✅ Comprehensive testing framework

**READY FOR:**
- 🚀 Production deployment
- 🧪 User acceptance testing
- 📊 Real-time data synchronization
- 🔄 Automated sync scheduling
- 📈 Performance optimization

The integration implementation is complete and production-ready! 🎉