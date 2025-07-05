import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, handleEdgeError } from '../_shared/edgeLogger.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    edgeLogger.info('Iniciando validação de integridade do sistema de pontuação', {}, 'VALIDATE_SCORING_INTEGRITY')

    // Calcular semana atual
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)

    // Contar usuários únicos com sessões completadas
    const { data: uniqueUsersWithSessions } = await supabaseClient
      .from('game_sessions')
      .select('user_id')
      .eq('is_completed', true)

    const uniqueUsersCount = new Set(uniqueUsersWithSessions?.map(s => s.user_id)).size

    // Contar usuários com pontuação > 0
    const { count: usersWithScores } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_score', 0)

    // Contar usuários no ranking atual
    const { count: usersInRanking } = await supabaseClient
      .from('weekly_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('week_start', weekStart.toISOString().split('T')[0])

    // Contar sessões órfãs (completadas sem competition_id)
    const { count: orphanedSessions } = await supabaseClient
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true)
      .is('competition_id', null)

    // Contar total de sessões completadas
    const { count: totalCompletedSessions } = await supabaseClient
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true)

    // Determinar problemas
    const issues: string[] = []
    
    if (usersWithScores === 0) {
      issues.push('Nenhum usuário possui pontuação registrada')
    }
    
    if (usersInRanking && usersWithScores && usersInRanking < usersWithScores) {
      issues.push(`${usersWithScores - usersInRanking} usuários com pontuação não estão no ranking`)
    }
    
    if (orphanedSessions && orphanedSessions > 0) {
      issues.push(`${orphanedSessions} sessões completadas sem vinculação a competições`)
    }

    const orphanedPercentage = totalCompletedSessions > 0 
      ? ((orphanedSessions || 0) / totalCompletedSessions * 100).toFixed(1)
      : '0'

    const validationPassed = issues.length === 0

    const result = {
      users_with_completed_sessions: uniqueUsersCount,
      users_with_scores: usersWithScores || 0,
      users_in_current_ranking: usersInRanking || 0,
      orphaned_sessions: orphanedSessions || 0,
      total_completed_sessions: totalCompletedSessions || 0,
      orphaned_sessions_percentage: parseFloat(orphanedPercentage),
      current_week_start: weekStart.toISOString().split('T')[0],
      validation_passed: validationPassed,
      issues,
      system_health: validationPassed ? 'healthy' : (issues.length > 2 ? 'critical' : 'warning')
    }

    if (!validationPassed) {
      edgeLogger.warn('Problemas de integridade detectados', {
        issues,
        systemHealth: result.system_health
      }, 'VALIDATE_SCORING_INTEGRITY');
    }

    edgeLogger.operation('scoring_integrity_validation', true, {
      validationPassed,
      issuesCount: issues.length,
      systemHealth: result.system_health
    }, 'VALIDATE_SCORING_INTEGRITY')

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return handleEdgeError(error, 'VALIDATE_SCORING_INTEGRITY', 'scoring_validation')
  }
})