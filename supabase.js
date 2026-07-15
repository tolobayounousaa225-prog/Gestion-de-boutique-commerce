import { createClient } from '@supabase/supabase-js'

// Configuration Supabase — MaBoutique
const SUPABASE_URL = 'https://vwibkrnhqntekajvkjsa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aWJrcm5ocW50ZWthanZranNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNjE0MjQsImV4cCI6MjA5OTYzNzQyNH0.meW8ywppoPQTWz2mVZhmEOqv-VqWdVc7OA2hqkcknrs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
