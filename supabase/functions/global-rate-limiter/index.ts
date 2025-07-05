import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

interface RateLimitConfig {
  endpoint: string
  maxRequests: number
  windowMinutes: number
  blockDurationMinutes?: number
}

// Configurações de rate limiting por endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': { endpoint: '/api/auth/login', maxRequests: 5, windowMinutes: 15, blockDurationMinutes: 30 },
  '/api/auth/register': { endpoint: '/api/auth/register', maxRequests: 3, windowMinutes: 60, blockDurationMinutes: 60 },
  '/api/game/session': { endpoint: '/api/game/session', maxRequests: 100, windowMinutes: 60 },
  '/api/admin/*': { endpoint: '/api/admin/*', maxRequests: 50, windowMinutes: 15, blockDurationMinutes: 15 },
  'default': { endpoint: 'default', maxRequests: 200, windowMinutes: 15 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      identifier, 
      identifierType, 
      endpoint, 
      userAgent,
      correlationId 
    } = await req.json()

    // Validar entrada
    validateInput.required(identifier, 'identifier');
    validateInput.required(identifierType, 'identifierType');
    validateInput.required(endpoint, 'endpoint');

    edgeLogger.info('Verificação de rate limit iniciada', {
      endpoint,
      identifierType,
      correlationId
    }, 'GLOBAL_RATE_LIMITER');

    // Determinar configuração de rate limit
    const config = RATE_LIMITS[endpoint] || 
                  (endpoint.startsWith('/api/admin/') ? RATE_LIMITS['/api/admin/*'] : RATE_LIMITS['default'])

    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

    // Verificar se já está bloqueado
    const { data: blockedCheck } = await supabase
      .from('rate_limits_global')
      .select('blocked_until')
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .not('blocked_until', 'is', null)
      .gte('blocked_until', new Date().toISOString())
      .maybeSingle()

    if (blockedCheck) {
      edgeLogger.security('Requisição bloqueada por rate limit', {
        endpoint,
        blockedUntil: blockedCheck.blocked_until
      }, 'GLOBAL_RATE_LIMITER');

      // Registrar métricas da tentativa bloqueada
      await supabase
        .from('performance_metrics')
        .insert({
          endpoint,
          method: 'BLOCKED',
          response_time_ms: 0,
          status_code: 429,
          user_id: identifierType === 'user_id' ? identifier : null,
          ip_address: identifierType === 'ip' ? identifier : null,
          user_agent: userAgent,
          correlation_id: correlationId
        })

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded - currently blocked',
          blockedUntil: blockedCheck.blocked_until,
          retryAfter: Math.ceil((new Date(blockedCheck.blocked_until).getTime() - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((new Date(blockedCheck.blocked_until).getTime() - Date.now()) / 1000).toString()
          } 
        }
      )
    }

    // Contar tentativas na janela atual
    const { data: attempts, count } = await supabase
      .from('rate_limits_global')
      .select('*', { count: 'exact' })
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .gte('window_start', windowStart.toISOString())

    const currentAttempts = count || 0

    // Verificar se excedeu o limite
    if (currentAttempts >= config.maxRequests) {
      // Criar registro de bloqueio
      const blockedUntil = new Date()
      blockedUntil.setMinutes(blockedUntil.getMinutes() + (config.blockDurationMinutes || 60))

      await supabase
        .from('rate_limits_global')
        .insert({
          identifier,
          identifier_type: identifierType,
          endpoint: config.endpoint,
          attempts: currentAttempts + 1,
          window_start: new Date().toISOString(),
          blocked_until: blockedUntil.toISOString()
        })

      // Criar alerta crítico se muitas tentativas
      if (currentAttempts > config.maxRequests * 2) {
        edgeLogger.security('Rate limit abuse detectado', {
          identifier,
          endpoint,
          attempts: currentAttempts + 1,
          limit: config.maxRequests
        }, 'GLOBAL_RATE_LIMITER');

        await supabase
          .from('system_alerts')
          .insert({
            alert_type: 'rate_limit_abuse',
            severity: 'high',
            title: `Rate Limit Abuse Detected`,
            message: `Identifier ${identifier} exceeded rate limit by ${currentAttempts - config.maxRequests} requests`,
            metadata: {
              identifier,
              identifierType,
              endpoint,
              attempts: currentAttempts + 1,
              limit: config.maxRequests,
              correlationId
            }
          })
      }

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          limit: config.maxRequests,
          windowMinutes: config.windowMinutes,
          attempts: currentAttempts + 1,
          blockedUntil: blockedUntil.toISOString(),
          retryAfter: config.blockDurationMinutes ? config.blockDurationMinutes * 60 : 3600
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': (config.blockDurationMinutes ? config.blockDurationMinutes * 60 : 3600).toString()
          } 
        }
      )
    }

    // Registrar tentativa válida
    await supabase
      .from('rate_limits_global')
      .insert({
        identifier,
        identifier_type: identifierType,
        endpoint: config.endpoint,
        attempts: 1,
        window_start: new Date().toISOString()
      })

    edgeLogger.operation('rate_limit_check', true, {
      remaining: config.maxRequests - currentAttempts - 1,
      limit: config.maxRequests
    }, 'GLOBAL_RATE_LIMITER');

    // Retornar sucesso com informações de rate limit
    return new Response(
      JSON.stringify({
        success: true,
        remaining: config.maxRequests - currentAttempts - 1,
        limit: config.maxRequests,
        windowMinutes: config.windowMinutes,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': (config.maxRequests - currentAttempts - 1).toString(),
          'X-RateLimit-Reset': Math.floor((Date.now() + config.windowMinutes * 60 * 1000) / 1000).toString()
        } 
      }
    )

  } catch (error) {
    return handleEdgeError(error, 'GLOBAL_RATE_LIMITER', 'rate_limit_check')
  }
})