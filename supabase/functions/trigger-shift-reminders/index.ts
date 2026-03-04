import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Create in-app notifications for due reminders
    const { data: count, error } = await supabase.rpc('enqueue_due_shift_reminders')
    if (error) throw error

    // 2. Send push notifications for due shifts
    const now = new Date()
    const { data: dueShifts } = await supabase
      .from('shifts')
      .select(`
        id, date, start_time, end_time, position, location,
        assigned_worker:profiles!shifts_assigned_worker_id_fkey(user_id, full_name)
      `)
      .eq('status', 'scheduled')
      .not('assigned_worker_id', 'is', null)

    let pushSent = 0
    if (dueShifts) {
      for (const shift of dueShifts) {
        const shiftStart = new Date(`${shift.date}T${shift.start_time}`)
        const hoursUntil = (shiftStart.getTime() - now.getTime()) / 3600000

        // Send push for shifts starting in 1-3 hours
        if (hoursUntil > 0 && hoursUntil <= 3) {
          const worker = shift.assigned_worker as any
          if (!worker?.user_id) continue

          try {
            const pushUrl = `${supabaseUrl}/functions/v1/send-push-notification`
            const response = await fetch(pushUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                user_id: worker.user_id,
                title: '⏰ Shift starting soon',
                body: `${shift.position} at ${shift.location} • ${shift.start_time} - ${shift.end_time}`,
                url: '/worker',
              }),
            })
            if (response.ok) pushSent++
          } catch (err) {
            console.error('Push send error:', err)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ reminders_created: count || 0, push_sent: pushSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Shift reminder error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
