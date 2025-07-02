import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMITS = {
  password_change: { maxAttempts: 3, windowMinutes: 60 },
  role_change: { maxAttempts: 5, windowMinutes: 30 },
  user_delete: { maxAttempts: 2, windowMinutes: 120 },
  email_update: { maxAttempts: 10, windowMinutes: 60 }
}

const secureLog = {
  security: (message: string, data?: any) => {
    const maskedData = data ? maskSensitiveData(data) : undefined;
    console.warn(`🔒 [SECURITY] ${message}`, maskedData || '');
  },
  error: (message: string, data?: any) => {
    const maskedData = data ? maskSensitiveData(data) : undefined;
    console.error(`[ERROR] ${message}`, maskedData || '');
  }
};

const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'email', 'token', 'user_id', 'admin_id'];
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***';
    }
  });
  
  return masked;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify admin user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: hasAdminRole } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (!hasAdminRole) {
      throw new Error('Insufficient permissions')
    }

    const { action, targetUserId } = await req.json()

    if (!action || !RATE_LIMITS[action as keyof typeof RATE_LIMITS]) {
      throw new Error('Invalid action')
    }

    const rateLimit = RATE_LIMITS[action as keyof typeof RATE_LIMITS]
    const windowStart = new Date(Date.now() - rateLimit.windowMinutes * 60 * 1000)

    // Check rate limit
    const { data: recentAttempts, error: countError } = await supabaseAdmin
      .from('admin_actions')
      .select('id')
      .eq('admin_id', user.id)
      .eq('action_type', action)
      .gte('created_at', windowStart.toISOString())

    if (countError) {
      secureLog.error('Error checking rate limit', { action });
      throw new Error('Rate limit check failed')
    }

    if (recentAttempts && recentAttempts.length >= rateLimit.maxAttempts) {
      secureLog.security('Rate limit exceeded', { 
        action, 
        attempts: recentAttempts.length,
        maxAttempts: rateLimit.maxAttempts,
        windowMinutes: rateLimit.windowMinutes
      });
      
      throw new Error(`Rate limit exceeded. Maximum ${rateLimit.maxAttempts} attempts per ${rateLimit.windowMinutes} minutes`)
    }

    // Log the attempt
    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        target_user_id: targetUserId || null,
        action_type: action,
        details: {
          timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      })

    if (logError) {
      secureLog.error('Failed to log admin action', { action });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        remaining_attempts: rateLimit.maxAttempts - (recentAttempts?.length || 0) - 1
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    secureLog.error('Rate limiter error', { error: error.message });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      }
    )
  }
})