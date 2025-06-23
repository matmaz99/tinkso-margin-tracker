# Tinkso Margin Tracker

A financial analytics application for tracking project margins, managing invoices, and monitoring profitability.

## Features

- **Project Management**: Track project margins and financial performance
- **Invoice Processing**: OCR-powered invoice scanning and processing
- **Financial Analytics**: Real-time margin calculations and reporting
- **Integration Support**: ClickUp and Qonto integrations
- **Multi-currency**: Support for EUR and USD
- **Dark/Light Mode**: Theme switching support

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **OCR**: OpenAI Vision API
- **Integrations**: ClickUp API, Qonto API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for OCR features)
- ClickUp API key (optional)
- Qonto API key (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/matmaz99/tinkso-margin-tracker.git
cd tinkso-margin-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for OCR)
OPENAI_API_KEY=your_openai_api_key

# ClickUp (optional)
NEXT_PUBLIC_CLICKUP_API_KEY=your_clickup_api_key
NEXT_PUBLIC_CLICKUP_TASK_LIST_ID=your_list_id
NEXT_PUBLIC_CLICKUP_CUSTOM_FIELD_ID=your_field_id

# Qonto (optional)
QONTO_API_KEY=your_qonto_api_key
QONTO_ORGANIZATION_ID=your_org_id
```

5. Run database migrations:
```bash
npm run supabase:migrate
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmatmaz99%2Ftinkso-margin-tracker&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OPENAI_API_KEY&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fmatmaz99%2Ftinkso-margin-tracker%23environment-variables)

1. Click the "Deploy with Vercel" button above
2. Configure the required environment variables
3. Deploy!

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and add environment variables in Vercel dashboard

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for OCR features | Yes |
| `NEXT_PUBLIC_CLICKUP_API_KEY` | ClickUp API key | No |
| `NEXT_PUBLIC_CLICKUP_TASK_LIST_ID` | ClickUp list ID for sync | No |
| `NEXT_PUBLIC_CLICKUP_CUSTOM_FIELD_ID` | ClickUp custom field ID | No |
| `QONTO_API_KEY` | Qonto API key | No |
| `QONTO_ORGANIZATION_ID` | Qonto organization ID | No |

## Database Setup

The application uses Supabase. Run the migrations in the `supabase/migrations` folder in order:

1. `001_tinkso_margin_tracker_schema.sql` - Core schema
2. `002_fix_sync_log_rls_policies.sql` - RLS policies
3. `002_ocr_processing_enhancements.sql` - OCR features
4. `003_add_clickup_folder_id.sql` - ClickUp integration
5. `004_add_supplier_iban_field.sql` - Supplier fields
6. `005_add_line_items_and_attachments.sql` - Invoice details

## License

MIT