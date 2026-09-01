import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://foxnqpgioefshcykiqsg.supabase.co'
const supabaseAnonKey = 'sb_publishable_LaPA6ek0WNNRQlMeeLGMHg_8ItwA-GZ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)