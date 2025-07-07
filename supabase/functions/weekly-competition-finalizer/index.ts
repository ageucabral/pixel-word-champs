import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, handleEdgeError } from '../_shared/edgeLogger.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar variáveis de ambiente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      edgeLogger.error('Variáveis de ambiente não configuradas', {}, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    edgeLogger.info('🚀 Iniciando finalização automática de competições semanais', {
      executedAt: new Date().toISOString(),
      timezone: 'UTC',
      brazilTime: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }, 'WEEKLY_COMPETITION_FINALIZER');

    // Parse do body da requisição para identificar tipo de execução
    let requestBody: any = {};
    try {
      const body = await req.text();
      if (body) {
        requestBody = JSON.parse(body);
      }
    } catch (e) {
      edgeLogger.warn('Não foi possível parsear body da requisição', { error: e.message }, 'WEEKLY_COMPETITION_FINALIZER');
    }

    // Chamar função SQL de finalização
    const { data: finalizationResult, error: finalizationError } = await supabase
      .rpc('finalize_weekly_competition');

    if (finalizationError) {
      edgeLogger.error('❌ Erro ao executar finalização via SQL', {
        error: finalizationError,
        code: finalizationError.code,
        message: finalizationError.message
      }, 'WEEKLY_COMPETITION_FINALIZER');
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro na finalização SQL',
        details: finalizationError.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log resultado da finalização
    if (finalizationResult?.success) {
      edgeLogger.info('✅ Finalização executada com sucesso', {
        result: finalizationResult,
        profilesReset: finalizationResult.profiles_reset || 0,
        snapshotId: finalizationResult.snapshot_id,
        requestType: requestBody.manual_trigger ? 'manual' : 'scheduled'
      }, 'WEEKLY_COMPETITION_FINALIZER');
    } else {
      edgeLogger.warn('⚠️ Nenhuma competição precisava ser finalizada', {
        result: finalizationResult,
        requestType: requestBody.manual_trigger ? 'manual' : 'scheduled'
      }, 'WEEKLY_COMPETITION_FINALIZER');
    }

    // Executar monitoramento do sistema
    const { data: monitoringResult, error: monitoringError } = await supabase
      .rpc('monitor_cron_executions');

    if (!monitoringError && monitoringResult) {
      edgeLogger.info('📊 Monitoramento executado', {
        monitoring: monitoringResult,
        systemHealth: monitoringResult.status
      }, 'WEEKLY_COMPETITION_FINALIZER');
    }

    return new Response(JSON.stringify({
      success: true,
      finalization: finalizationResult,
      monitoring: monitoringResult,
      execution_type: requestBody.manual_trigger ? 'manual' : 'scheduled',
      timestamp: new Date().toISOString(),
      brazil_time: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return handleEdgeError(error, 'WEEKLY_COMPETITION_FINALIZER', corsHeaders);
  }
});