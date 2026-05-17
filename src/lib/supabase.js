import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ejptyochvnecrdxuptsd.supabase.co'
const supabaseAnonKey = 'sb_publishable_KQmqUX6aIYRJcSPG-0vbUw_4wb8ygdx'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)