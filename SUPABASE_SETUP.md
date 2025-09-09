# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account if you don't have one
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Project URLs and Keys

1. Go to Project Settings > API
2. Copy the following values:
   - Project URL
   - Project API Keys (anon/public key and service_role key)

## 3. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`
2. Replace the placeholder values with your actual Supabase values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

## 4. Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `src/lib/supabase/schema.sql`
4. Run the SQL script to create all tables and policies

## 5. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure the Site URL to `http://localhost:3000` for development
3. Add any additional redirect URLs you need for production

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Try to sign up with a new account
4. Check if the profile and settings are automatically created in your Supabase dashboard

Your inventory management system should now be connected to Supabase!