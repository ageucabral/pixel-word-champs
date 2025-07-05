import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

interface AlertThresholds {
  responseTime: { warning: number; critical: number }
  errorRate: { warning: number; critical: number }
  dbConnections: { warning: number; critical: number }
  activeUsers: { warning: number; critical: number }
}

const ALERT_THRESHOLDS: AlertThresholds = {
  responseTime: { warning: 1000, critical: 2000 }, // ms
  errorRate: { warning: 5, critical: 10 }, // %
  dbConnections: { warning: 80, critical: 95 }, // count
  activeUsers: { warning: 50, critical: 100 } // count in last hour
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

    const { action } = await req.json()

    edgeLogger.info('System monitor executando ação', { action }, 'SYSTEM_MONITOR');

    switch (action) {
      case 'health-check':
        return await performHealthCheck(supabase)
      
      case 'log-performance':
        const { endpoint, method, responseTime, statusCode, userId, ipAddress, userAgent, correlationId } = await req.json()
        return await logPerformanceMetric(supabase, {
          endpoint, method, responseTime, statusCode, userId, ipAddress, userAgent, correlationId
        })
      
      case 'create-alert':
        const { alertType, severity, title, message, metadata } = await req.json()
        return await createAlert(supabase, { alertType, severity, title, message, metadata })
      
      case 'get-dashboard-data':
        return await getDashboardData(supabase)
      
      default:
        edgeLogger.warn('Ação inválida solicitada', { action }, 'SYSTEM_MONITOR');
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    return handleEdgeError(error, 'SYSTEM_MONITOR', 'system_monitoring')
  }
})

async function performHealthCheck(supabase: any) {
  const startTime = Date.now()
  
  try {
    edgeLogger.info('Iniciando health check completo', {}, 'SYSTEM_MONITOR');

    // Verificar performance média (última hora)
    const { data: performanceData } = await supabase
      .from('performance_metrics')
      .select('response_time_ms, status_code')
      .gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    const avgResponseTime = performanceData?.length 
      ? performanceData.reduce((sum: number, metric: any) => sum + metric.response_time_ms, 0) / performanceData.length
      : 0

    const errorRate = performanceData?.length
      ? (performanceData.filter((m: any) => m.status_code >= 400).length / performanceData.length) * 100
      : 0

    // Verificar usuários ativos (última hora)
    const { data: activeUsersData, count: activeUsers } = await supabase
      .from('game_sessions')
      .select('user_id', { count: 'exact' })
      .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    // Verificar alertas ativos críticos
    const { data: criticalAlerts, count: criticalAlertsCount } = await supabase
      .from('system_alerts')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .eq('severity', 'critical')

    // Determinar status geral
    let overallStatus = 'healthy'
    let issues: string[] = []

    if (avgResponseTime > ALERT_THRESHOLDS.responseTime.critical) {
      overallStatus = 'critical'
      issues.push(`High response time: ${Math.round(avgResponseTime)}ms`)
    } else if (avgResponseTime > ALERT_THRESHOLDS.responseTime.warning) {
      overallStatus = 'warning'
      issues.push(`Elevated response time: ${Math.round(avgResponseTime)}ms`)
    }

    if (errorRate > ALERT_THRESHOLDS.errorRate.critical) {
      overallStatus = 'critical'
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`)
    } else if (errorRate > ALERT_THRESHOLDS.errorRate.warning) {
      if (overallStatus === 'healthy') overallStatus = 'warning'
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`)
    }

    if (criticalAlertsCount && criticalAlertsCount > 0) {
      overallStatus = 'critical'
      issues.push(`${criticalAlertsCount} critical alerts active`)
    }

    // Criar alertas se necessário
    if (overallStatus === 'critical' && issues.length > 0) {
      edgeLogger.security('System health crítico detectado', {
        issues,
        avgResponseTime,
        errorRate
      }, 'SYSTEM_MONITOR');

      await createAlert(supabase, {
        alertType: 'system_health',
        severity: 'critical',
        title: 'System Health Critical',
        message: `System health is critical: ${issues.join(', ')}`,
        metadata: {
          avgResponseTime,
          errorRate,
          activeUsers,
          criticalAlertsCount,
          issues
        }
      })
    }

    // Registrar health check
    await supabase
      .from('system_health_checks')
      .insert({
        check_type: 'automated_health_check',
        status: overallStatus,
        response_time_ms: Date.now() - startTime,
        details: {
          avgResponseTime,
          errorRate,
          activeUsers,
          criticalAlertsCount,
          issues,
          checkedAt: new Date().toISOString()
        }
      })

    edgeLogger.operation('health_check', true, {
      status: overallStatus,
      issues: issues.length,
      duration: Date.now() - startTime
    }, 'SYSTEM_MONITOR');

    return new Response(
      JSON.stringify({
        status: overallStatus,
        avgResponseTime,
        errorRate,
        activeUsers,
        criticalAlertsCount,
        issues,
        timestamp: new Date().toISOString(),
        checkDurationMs: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Criar alerta de falha no health check
    await createAlert(supabase, {
      alertType: 'monitoring_failure',
      severity: 'high',
      title: 'Health Check Failed',
      message: `Health check failed: ${error.message}`,
      metadata: { error: error.message, timestamp: new Date().toISOString() }
    })

    throw error
  }
}

async function logPerformanceMetric(supabase: any, metric: any) {
  await supabase
    .from('performance_metrics')
    .insert({
      endpoint: metric.endpoint,
      method: metric.method,
      response_time_ms: metric.responseTime,
      status_code: metric.statusCode,
      user_id: metric.userId,
      ip_address: metric.ipAddress,
      user_agent: metric.userAgent,
      correlation_id: metric.correlationId
    })

  // Verificar se precisa criar alerta por slow query
  if (metric.responseTime > ALERT_THRESHOLDS.responseTime.critical) {
    edgeLogger.warn('Slow query detectada', {
      endpoint: metric.endpoint,
      responseTime: metric.responseTime
    }, 'SYSTEM_MONITOR');

    await createAlert(supabase, {
      alertType: 'slow_query',
      severity: 'high',
      title: 'Slow Query Detected',
      message: `Endpoint ${metric.endpoint} took ${metric.responseTime}ms to respond`,
      metadata: metric
    })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createAlert(supabase: any, alert: any) {
  // Verificar se já existe alerta similar ativo recente (última hora)
  const { data: existingAlert } = await supabase
    .from('system_alerts')
    .select('id')
    .eq('alert_type', alert.alertType)
    .eq('status', 'active')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .maybeSingle()

  if (existingAlert) {
    edgeLogger.info('Alerta duplicado evitado', {
      alertType: alert.alertType,
      existingId: existingAlert.id
    }, 'SYSTEM_MONITOR');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Similar alert already exists',
        alertId: existingAlert.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Criar novo alerta
  const { data: newAlert } = await supabase
    .from('system_alerts')
    .insert({
      alert_type: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata
    })
    .select()
    .single()

  edgeLogger.operation('alert_created', true, {
    alertType: alert.alertType,
    severity: alert.severity
  }, 'SYSTEM_MONITOR');

  return new Response(
    JSON.stringify({ 
      success: true, 
      alert: newAlert 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDashboardData(supabase: any) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Métricas de performance (última hora)
  const { data: performanceMetrics } = await supabase
    .from('performance_metrics')
    .select('response_time_ms, status_code, endpoint')
    .gte('recorded_at', oneHourAgo)

  // Alertas ativos
  const { data: activeAlerts } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  // Health checks recentes
  const { data: recentHealthChecks } = await supabase
    .from('system_health_checks')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(24)

  // Rate limit statistics (última hora)
  const { data: rateLimitStats, count: blockedRequests } = await supabase
    .from('rate_limits_global')
    .select('*', { count: 'exact' })
    .gte('window_start', oneHourAgo)
    .not('blocked_until', 'is', null)

  // Usuários ativos (últimas 24h)
  const { count: activeUsers24h } = await supabase
    .from('user_activity_days')
    .select('user_id', { count: 'exact' })
    .gte('activity_date', oneDayAgo)

  const dashboardData = {
    overview: {
      avgResponseTime: performanceMetrics?.length 
        ? Math.round(performanceMetrics.reduce((sum: number, m: any) => sum + m.response_time_ms, 0) / performanceMetrics.length)
        : 0,
      errorRate: performanceMetrics?.length
        ? ((performanceMetrics.filter((m: any) => m.status_code >= 400).length / performanceMetrics.length) * 100).toFixed(1)
        : 0,
      activeUsers24h,
      blockedRequests: blockedRequests || 0,
      activeAlertsCount: activeAlerts?.length || 0
    },
    alerts: activeAlerts || [],
    healthChecks: recentHealthChecks || [],
    performance: performanceMetrics || [],
    rateLimits: rateLimitStats || [],
    timestamp: new Date().toISOString()
  }

  edgeLogger.operation('dashboard_data_generated', true, {
    metricsCount: performanceMetrics?.length || 0,
    alertsCount: activeAlerts?.length || 0
  }, 'SYSTEM_MONITOR');

  return new Response(
    JSON.stringify(dashboardData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}