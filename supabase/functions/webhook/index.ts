import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature || !endpointSecret) throw new Error('Missing signature or endpoint secret');

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userId = session.metadata.user_id;

        // Update user's profile with Stripe customer ID and subscription info
        await supabaseClient
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            subscription_status: 'active',
            subscription_tier: 'premium', // Adjust based on the plan
          })
          .eq('id', userId);

        // Add subscription record
        await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_id: 'premium', // Adjust based on the plan
            current_period_start: new Date(),
            current_period_end: new Date(session.current_period_end * 1000),
          });

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const status = subscription.status;
        const customerId = subscription.customer;

        // Update subscription status in database
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseClient
            .from('profiles')
            .update({
              subscription_status: status === 'active' ? 'active' : 'inactive',
            })
            .eq('id', profile.id);

          await supabaseClient
            .from('subscriptions')
            .update({
              status: status,
              current_period_end: new Date(subscription.current_period_end * 1000),
            })
            .eq('stripe_subscription_id', subscription.id);
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});