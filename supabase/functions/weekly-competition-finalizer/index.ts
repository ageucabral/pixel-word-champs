import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, handleEdgeError } from '../_shared/edgeLogger.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Usar variáveis de ambiente do Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    edgeLogger.error('Variáveis de ambiente não configuradas', {}, 'WEEKLY_COMPETITION_FINALIZER');
    return new Response(JSON.stringify({ 
      error: 'Configuração do servidor incompleta' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    edgeLogger.info('Iniciando verificação de finalização automática de competições', {}, 'WEEKLY_COMPETITION_FINALIZER');

    // Verificar se existe competição completed que precisa ser finalizada (snapshot)
    const { data: competitionsToCheck, error: checkError } = await supabase
      .from('weekly_config')
      .select('*')
      .in('status', ['active', 'completed'])
      .order('end_date', { ascending: true });

    if (checkError) {
      edgeLogger.error('Erro ao buscar competições', { error: checkError }, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        error: 'Erro ao verificar competições',
        details: checkError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!competitionsToCheck || competitionsToCheck.length === 0) {
      edgeLogger.info('Nenhuma competição ativa ou completed encontrada', {}, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        message: 'Nenhuma competição para finalizar',
        status: 'no_action_needed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Primeiro, executar atualização de status para marcar competições expiradas como 'completed'
    edgeLogger.info('Executando atualização de status de competições semanais', {}, 'WEEKLY_COMPETITION_FINALIZER');
    
    const { data: statusUpdateResult, error: statusUpdateError } = await supabase
      .rpc('update_weekly_competitions_status');

    if (statusUpdateError) {
      edgeLogger.error('Erro na atualização de status', { error: statusUpdateError }, 'WEEKLY_COMPETITION_FINALIZER');
    } else {
      edgeLogger.info('Atualização de status executada', { result: statusUpdateResult }, 'WEEKLY_COMPETITION_FINALIZER');
    }

    // Agora procurar competições 'completed' que precisam de snapshot
    const { data: completedCompetitions, error: completedError } = await supabase
      .from('weekly_config')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (completedError) {
      edgeLogger.error('Erro ao buscar competições completed', { error: completedError }, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar competições finalizadas',
        details: completedError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!completedCompetitions || completedCompetitions.length === 0) {
      edgeLogger.info('Nenhuma competição completed precisa de snapshot', {}, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        message: 'Nenhuma competição completed precisa de finalização',
        status: 'no_action_needed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se alguma das competições completed ainda não tem snapshot
    let competitionToFinalize = null;
    
    for (const comp of completedCompetitions) {
      // Verificar se já existe snapshot
      const { data: existingSnapshot } = await supabase
        .from('weekly_competitions_snapshot')
        .select('id')
        .eq('competition_id', comp.id)
        .single();
      
      if (!existingSnapshot) {
        competitionToFinalize = comp;
        edgeLogger.info('Encontrada competição completed sem snapshot', {
          competition_id: comp.id,
          end_date: comp.end_date
        }, 'WEEKLY_COMPETITION_FINALIZER');
        break;
      }
    }

    if (!competitionToFinalize) {
      edgeLogger.info('Todas as competições completed já possuem snapshot', {}, 'WEEKLY_COMPETITION_FINALIZER');
      return new Response(JSON.stringify({ 
        message: 'Todas as competições completed já foram finalizadas',
        status: 'no_action_needed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Executar a finalização completa usando a função SQL existente
    edgeLogger.info('Executando finalização automática da competição', {
      competition_id: competitionToFinalize.id,
      end_date: competitionToFinalize.end_date
    }, 'WEEKLY_COMPETITION_FINALIZER');

    const { data: finalizationResult, error: finalizationError } = await supabase
      .rpc('finalize_weekly_competition');

    if (finalizationError) {
      edgeLogger.error('Erro na finalização da competição', { 
        error: finalizationError,
        competition: competitionToFinalize
      }, 'WEEKLY_COMPETITION_FINALIZER');
      
      return new Response(JSON.stringify({ 
        error: 'Erro na finalização da competição',
        details: finalizationError.message,
        competition_id: competitionToFinalize.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!finalizationResult?.success) {
      edgeLogger.error('Finalização retornou erro', { 
        result: finalizationResult,
        competition: competitionToFinalize
      }, 'WEEKLY_COMPETITION_FINALIZER');
      
      return new Response(JSON.stringify({ 
        error: 'Falha na finalização',
        details: finalizationResult?.error || 'Erro desconhecido',
        competition_id: competitionToFinalize.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    edgeLogger.operation('weekly_competition_finalization', true, {
      competition_finalized: competitionToFinalize.id,
      snapshot_created: finalizationResult.snapshot_id,
      profiles_reset: finalizationResult.profiles_reset,
      next_competition_activated: finalizationResult.activated_competition?.id
    }, 'WEEKLY_COMPETITION_FINALIZER');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Competição finalizada automaticamente com sucesso',
      finalization_result: finalizationResult,
      executed_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return handleEdgeError(error, 'WEEKLY_COMPETITION_FINALIZER', 'weekly_competition_finalization')
  }
});