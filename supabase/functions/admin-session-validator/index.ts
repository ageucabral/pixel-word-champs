import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'
import { edgeLogger, validateInput, handleEdgeError } from '../_shared/edgeLogger.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      edgeLogger.security('Tentativa de acesso sem autorização', {}, 'ADMIN_SESSION_VALIDATOR')
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

    // Verify user session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      edgeLogger.security('Invalid session attempt', {}, 'ADMIN_SESSION_VALIDATOR');
      throw new Error('Invalid session')
    }

    // Validate session freshness (not older than 24 hours)
    const sessionCreatedAt = new Date(user.created_at)
    const lastSignIn = new Date(user.last_sign_in_at || user.created_at)
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    if (lastSignIn < twentyFourHoursAgo) {
      edgeLogger.security('Session expired - forcing re-authentication', {
        lastSignIn: lastSignIn.toISOString(),
        threshold: twentyFourHoursAgo.toISOString()
      }, 'ADMIN_SESSION_VALIDATOR');
      
      throw new Error('Session expired - please login again')
    }

    // Check if user is admin
    const { data: hasAdminRole, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (roleError) {
      edgeLogger.error('Error checking admin role', { error: roleError.message }, 'ADMIN_SESSION_VALIDATOR');
      throw new Error('Role verification failed')
    }

    if (!hasAdminRole) {
      edgeLogger.security('Non-admin user attempting admin access', {
        timestamp: new Date().toISOString()
      }, 'ADMIN_SESSION_VALIDATOR');
      throw new Error('Admin access required')
    }

    // Verify account is not banned
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_banned, banned_at, ban_reason')
      .eq('id', user.id)
      .single()

    if (profileError) {
      edgeLogger.error('Error checking user profile', { error: profileError.message }, 'ADMIN_SESSION_VALIDATOR');
      throw new Error('Profile verification failed')
    }

    if (userProfile?.is_banned) {
      edgeLogger.security('Banned user attempting access', {
        bannedAt: userProfile.banned_at,
        reason: userProfile.ban_reason
      }, 'ADMIN_SESSION_VALIDATOR');
      throw new Error('Account is banned')
    }

    edgeLogger.info('Admin session validated successfully', {}, 'ADMIN_SESSION_VALIDATOR');

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: user.id,
        session_valid: true,
        admin_verified: true,
        last_sign_in: lastSignIn.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return handleEdgeError(error, 'ADMIN_SESSION_VALIDATOR', 'session_validation')
  }
})