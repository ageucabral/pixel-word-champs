import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      edgeLogger.security('Tentativa de acesso sem autorização', {}, 'ADMIN_UPDATE_PASSWORD')
      throw new Error('No authorization header')
    }

    // Create supabase client with service role (for admin operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verify the requesting user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      edgeLogger.security('Usuário não autenticado', { error: userError }, 'ADMIN_UPDATE_PASSWORD')
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (roleError || !hasAdminRole) {
      edgeLogger.security('Usuário sem permissões de admin', { userId: user.id }, 'ADMIN_UPDATE_PASSWORD')
      throw new Error('Insufficient permissions - admin role required')
    }

    // Get request body
    const { targetUserId, newPassword, username } = await req.json()

    // Validações de entrada
    validateInput.required(targetUserId, 'targetUserId')
    validateInput.required(newPassword, 'newPassword')
    validateInput.required(username, 'username')
    validateInput.uuid(targetUserId, 'targetUserId')
    validateInput.minLength(newPassword, 6, 'newPassword')

    edgeLogger.info('Iniciando atualização de senha pelo admin', { 
      adminId: user.id,
      targetUserId,
      username
    }, 'ADMIN_UPDATE_PASSWORD');

    // Update user password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      edgeLogger.error('Erro ao atualizar senha', { error: updateError.message }, 'ADMIN_UPDATE_PASSWORD');
      throw updateError
    }

    // Log the admin action
    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        target_user_id: targetUserId,
        action_type: 'password_change',
        details: {
          username: username,
          changed_at: new Date().toISOString(),
          status: 'completed'
        }
      })

    if (logError) {
      edgeLogger.warn('Falha ao registrar ação administrativa', { error: logError.message }, 'ADMIN_UPDATE_PASSWORD');
    }

    edgeLogger.operation('password_change', true, { 
      targetUserId,
      username
    }, 'ADMIN_UPDATE_PASSWORD');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password updated successfully for ${username}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return handleEdgeError(error, 'ADMIN_UPDATE_PASSWORD', 'password_update')
  }
})