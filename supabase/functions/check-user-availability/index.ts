import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { username, email, phone } = await req.json();

    if (!username && !email && !phone) {
      edgeLogger.warn('Requisição sem parâmetros válidos', {}, 'CHECK_USER_AVAILABILITY')
      return new Response(
        JSON.stringify({ error: 'Username, email ou phone deve ser fornecido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    edgeLogger.info('Verificando disponibilidade de usuário', { 
      hasUsername: !!username, 
      hasEmail: !!email, 
      hasPhone: !!phone 
    }, 'CHECK_USER_AVAILABILITY');

    const { data, error } = await supabaseClient.rpc('check_user_availability', {
      check_username: username || null,
      check_email: email || null,
      check_phone: phone || null
    });

    if (error) {
      edgeLogger.error('Erro ao verificar disponibilidade', { error }, 'CHECK_USER_AVAILABILITY');
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    edgeLogger.operation('check_user_availability', true, { 
      result: data,
      checked: { username: !!username, email: !!email, phone: !!phone }
    }, 'CHECK_USER_AVAILABILITY');

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return handleEdgeError(error, 'CHECK_USER_AVAILABILITY', 'user_availability_check')
  }
});