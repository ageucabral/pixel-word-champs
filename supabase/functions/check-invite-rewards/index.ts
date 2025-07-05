import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, handleEdgeError } from '../_shared/edgeLogger.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    edgeLogger.info('Iniciando verificação de recompensas de convite', {}, 'CHECK_INVITE_REWARDS')
    
    // Executar função de verificação e ativação de convites
    const { data, error } = await supabase.rpc('check_and_activate_invites')
    
    if (error) {
      edgeLogger.error('Erro em check_and_activate_invites', { error }, 'CHECK_INVITE_REWARDS')
      throw error
    }

    edgeLogger.operation('check_and_activate_invites', true, { data }, 'CHECK_INVITE_REWARDS')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invite rewards verification completed',
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return handleEdgeError(error, 'CHECK_INVITE_REWARDS', 'invite_rewards_verification')
  }
})