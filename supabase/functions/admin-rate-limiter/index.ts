import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

// Rate limiting configuration
const RATE_LIMITS = {
  password_change: { maxAttempts: 3, windowMinutes: 60 },
  role_change: { maxAttempts: 5, windowMinutes: 30 },
  user_delete: { maxAttempts: 2, windowMinutes: 120 },
  email_update: { maxAttempts: 10, windowMinutes: 60 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      edgeLogger.security('Tentativa de acesso sem autorização', {}, 'ADMIN_RATE_LIMITER')
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
    edgeLogger.info('Verificando usuário admin', {}, 'ADMIN_RATE_LIMITER')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      edgeLogger.security('Usuário não autorizado', { error: userError }, 'ADMIN_RATE_LIMITER')
      throw new Error('Unauthorized')
    }

    const { data: hasAdminRole } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (!hasAdminRole) {
      edgeLogger.security('Permissões insuficientes', { userId: user.id }, 'ADMIN_RATE_LIMITER')
      throw new Error('Insufficient permissions')
    }

    const { action, targetUserId } = await req.json()

    // Validações de entrada
    validateInput.required(action, 'action')
    
    if (!RATE_LIMITS[action as keyof typeof RATE_LIMITS]) {
      edgeLogger.warn('Ação inválida solicitada', { action }, 'ADMIN_RATE_LIMITER')
      throw new Error('Invalid action')
    }

    const rateLimit = RATE_LIMITS[action as keyof typeof RATE_LIMITS]
    const windowStart = new Date(Date.now() - rateLimit.windowMinutes * 60 * 1000)

    edgeLogger.info('Verificando rate limit', { action, maxAttempts: rateLimit.maxAttempts }, 'ADMIN_RATE_LIMITER')

    // Check rate limit
    const { data: recentAttempts, error: countError } = await supabaseAdmin
      .from('admin_actions')
      .select('id')
      .eq('admin_id', user.id)
      .eq('action_type', action)
      .gte('created_at', windowStart.toISOString())

    if (countError) {
      edgeLogger.error('Erro ao verificar rate limit', { action, error: countError }, 'ADMIN_RATE_LIMITER')
      throw new Error('Rate limit check failed')
    }

    if (recentAttempts && recentAttempts.length >= rateLimit.maxAttempts) {
      edgeLogger.security('Rate limit excedido', { 
        action, 
        attempts: recentAttempts.length,
        maxAttempts: rateLimit.maxAttempts,
        windowMinutes: rateLimit.windowMinutes
      }, 'ADMIN_RATE_LIMITER');
      
      throw new Error(`Rate limit exceeded. Maximum ${rateLimit.maxAttempts} attempts per ${rateLimit.windowMinutes} minutes`)
    }

    // Log the attempt
    edgeLogger.info('Registrando tentativa de ação', { action }, 'ADMIN_RATE_LIMITER')
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
      edgeLogger.warn('Falha ao registrar ação admin', { action, error: logError }, 'ADMIN_RATE_LIMITER')
    }

    edgeLogger.operation('rate_limit_check', true, {
      action,
      remainingAttempts: rateLimit.maxAttempts - (recentAttempts?.length || 0) - 1
    }, 'ADMIN_RATE_LIMITER')

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
    return handleEdgeError(error, 'ADMIN_RATE_LIMITER', 'check_rate_limit')
  }
})