import { createClient } from '@supabase/supabase-js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;

const findUserByEmail = async (adminClient, email) => {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data?.users?.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;

    if (!data?.users || data.users.length < perPage) break;
    page += 1;
  }

  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({
      error: 'Demo setup is not configured. Add Supabase URL, anon key, and service role key in Vercel.',
    });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const fullName = String(req.body?.fullName || '').trim() || null;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const demoExpiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

    let user = await findUserByEmail(adminClient, email);

    if (!user) {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          subscription_tier: 'bronze',
          subscription_status: 'active',
          demo_access: true,
          demo_expires_at: demoExpiresAt,
        },
      });

      if (createError) throw createError;
      user = created.user;
    } else {
      const { data: updated, error: updateUserError } = await adminClient.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: fullName || user.user_metadata?.full_name || null,
          subscription_tier: 'bronze',
          subscription_status: 'active',
          demo_access: true,
          demo_expires_at: demoExpiresAt,
        },
      });

      if (updateUserError) throw updateUserError;
      user = updated.user;
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        full_name: fullName,
        subscription_tier: 'bronze',
        subscription_status: 'active',
        connections_allowed: 1,
        active_connections: 0,
        subscription_expires_at: demoExpiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    return res.status(200).json({
      ok: true,
      email,
      expires_at: demoExpiresAt,
      subscription: {
        tier: 'bronze',
        status: 'active',
        connections_allowed: 1,
      },
    });
  } catch (error) {
    console.error('Demo setup error:', error);
    const message = error instanceof Error ? error.message : 'Unable to start demo.';
    return res.status(500).json({ error: message });
  }
}
