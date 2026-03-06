import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Minimal Web Push implementation using the Web Crypto API (no npm deps)
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')!
  const privateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')!
  const subject = Deno.env.get('WEB_PUSH_SUBJECT') || 'mailto:admin@align.app'

  // Use web-push library via esm.sh
  const webpush = await import('https://esm.sh/web-push@3.6.7')

  webpush.setVapidDetails(subject, publicKey, privateKey)

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    payload,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Only allow internal (service-role) calls — reject all others
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { user_id, title, body, url, data } = await req.json()

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: 'user_id and title required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch active subscriptions for the user
    const { data: subscriptions, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (subErr) throw subErr

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title, body: body || '', url: url || '/', data: data || {} })

    let sent = 0
    const staleIds: string[] = []

    for (const sub of subscriptions) {
      try {
        await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload)
        sent++
      } catch (err: any) {
        console.error(`Push failed for ${sub.id}:`, err?.statusCode || err?.message)
        // 404 or 410 = expired/unsubscribed
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleIds.push(sub.id)
        }
      }
    }

    // Deactivate stale subscriptions
    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').update({ is_active: false }).in('id', staleIds)
    }

    return new Response(JSON.stringify({ sent, total: subscriptions.length, stale: staleIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Push notification error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
