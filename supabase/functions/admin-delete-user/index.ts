
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

// Inicializar cliente Supabase com configurações específicas para operações administrativas
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`
      }
    }
  }
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, adminPassword, adminId } = await req.json()

    edgeLogger.info('Iniciando exclusão de usuário', { operation: 'delete_user' }, 'ADMIN_DELETE_USER')

    // Validações de entrada melhoradas
    validateInput.required(userId, 'userId')
    validateInput.required(adminId, 'adminId')
    validateInput.uuid(userId, 'userId')
    validateInput.uuid(adminId, 'adminId')

    // Validar se o admin existe e tem permissões
    edgeLogger.info('Verificando admin', { adminId }, 'ADMIN_DELETE_USER')
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', adminId)
      .single()

    if (adminProfileError || !adminProfile) {
      edgeLogger.error('Admin não encontrado', { error: adminProfileError }, 'ADMIN_DELETE_USER')
      throw new Error('Admin não encontrado')
    }

    edgeLogger.info('Admin encontrado', { username: adminProfile.username }, 'ADMIN_DELETE_USER')

    // Verificar se o admin tem role de admin usando RPC segura
    edgeLogger.info('Verificando permissões de admin', { adminId }, 'ADMIN_DELETE_USER')
    const { data: hasAdminRole, error: rolesError } = await supabase
      .rpc('has_role', {
        _user_id: adminId,
        _role: 'admin'
      })

    if (rolesError || !hasAdminRole) {
      edgeLogger.security('Tentativa de acesso sem permissões', { adminId, error: rolesError }, 'ADMIN_DELETE_USER')
      throw new Error('Usuário não tem permissões de administrador')
    }

    edgeLogger.info('Permissões de admin validadas', { adminId }, 'ADMIN_DELETE_USER')

    // Verificar se não é o próprio admin tentando se deletar
    if (adminId === userId) {
      edgeLogger.security('Tentativa de auto-exclusão bloqueada', { adminId, userId }, 'ADMIN_DELETE_USER')
      throw new Error('Você não pode excluir sua própria conta')
    }

    // Buscar dados do usuário para logs
    edgeLogger.info('Buscando dados do usuário', { userId }, 'ADMIN_DELETE_USER')
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    edgeLogger.info('Iniciando exclusão com CASCADE', { userId }, 'ADMIN_DELETE_USER')

    // Registrar ação administrativa ANTES da exclusão
    edgeLogger.info('Registrando ação administrativa', { adminId, userId }, 'ADMIN_DELETE_USER')
    const { error: logError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: null, // Não referenciar o usuário que será deletado
        action_type: 'delete_user',
        details: { 
          timestamp: new Date().toISOString(),
          deleted_user_id: userId,
          username: userProfile?.username || 'Usuário não encontrado'
        }
      })

    if (logError) {
      edgeLogger.warn('Erro ao registrar log', { error: logError }, 'ADMIN_DELETE_USER')
    } else {
      edgeLogger.info('Log registrado com sucesso', {}, 'ADMIN_DELETE_USER')
    }

    // Deletar o usuário do auth system com CASCADE automático
    edgeLogger.info('Deletando usuário do sistema de autenticação', { userId }, 'ADMIN_DELETE_USER')

    try {
      const { data: deleteAuthData, error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
      
      if (deleteAuthError) {
        edgeLogger.error('Erro ao deletar usuário do auth', {
          error: deleteAuthError,
          userId
        }, 'ADMIN_DELETE_USER')
        throw new Error(`Erro ao deletar usuário do sistema de autenticação: ${deleteAuthError.message}`)
      }

      edgeLogger.operation('delete_user_auth', true, {
        userId,
        deletedData: deleteAuthData
      }, 'ADMIN_DELETE_USER')

    } catch (authDeleteError) {
      edgeLogger.error('Exceção capturada ao deletar do auth', {
        error: authDeleteError,
        userId
      }, 'ADMIN_DELETE_USER')
      throw new Error(`Erro crítico ao deletar usuário do sistema de autenticação: ${authDeleteError.message}`)
    }

    edgeLogger.operation('complete_user_deletion', true, {
      userId,
      username: userProfile?.username
    }, 'ADMIN_DELETE_USER')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário excluído completamente do sistema',
        deletedUserId: userId,
        deletedUsername: userProfile?.username,
        method: 'CASCADE_DELETE',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return handleEdgeError(error, 'ADMIN_DELETE_USER', 'delete_user')
  }
})
