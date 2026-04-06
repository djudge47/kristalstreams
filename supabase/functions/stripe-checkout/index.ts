import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;

if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

async function createCustomerRecord(userId: string, customerId: string) {
  const { error } = await supabase.from('stripe_customers').insert({
    user_id: userId,
    customer_id: customerId,
  });

  if (error) {
    console.error(`Failed to create customer record for user ${userId}:`, error);
    throw new Error('Failed to create customer record');
  }
}

async function createSubscriptionRecord(customerId: string) {
  const { error } = await supabase.from('stripe_subscriptions').insert({
    customer_id: customerId,
    status: 'not_started',
  });

  if (error) {
    console.error(`Failed to create subscription record for customer ${customerId}:`, error);
    throw new Error('Failed to create subscription record');
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode } = await req.json();

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      return corsResponse({ error }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      console.error('Auth error:', getUserError);
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    try {
      // First, check if customer already exists
      const { data: existingCustomer, error: getCustomerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (getCustomerError) {
        console.error('Database query error:', getCustomerError);
        throw new Error('Failed to check existing customer');
      }

      let customerId: string;

      if (!existingCustomer) {
        // Create new Stripe customer
        try {
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: user.id,
            },
          });
          customerId = newCustomer.id;

          // Create customer record in database
          await createCustomerRecord(user.id, customerId);

          if (mode === 'subscription') {
            await createSubscriptionRecord(customerId);
          }
        } catch (error) {
          console.error('Error creating customer:', error);
          // If we created a Stripe customer but failed to create the database record,
          // clean up the Stripe customer
          if (customerId!) {
            try {
              await stripe.customers.del(customerId);
            } catch (deleteError) {
              console.error('Failed to clean up Stripe customer:', deleteError);
            }
          }
          throw new Error('Failed to create customer');
        }
      } else {
        customerId = existingCustomer.customer_id;

        if (mode === 'subscription') {
          // Check if subscription record exists
          const { data: subscription, error: getSubscriptionError } = await supabase
            .from('stripe_subscriptions')
            .select('status')
            .eq('customer_id', customerId)
            .maybeSingle();

          if (getSubscriptionError) {
            console.error('Error checking subscription:', getSubscriptionError);
            throw new Error('Failed to check subscription status');
          }

          if (!subscription) {
            await createSubscriptionRecord(customerId);
          }
        }
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode,
        success_url,
        cancel_url,
      });

      return corsResponse({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Checkout process error:', error);
      return corsResponse({ error: error.message }, 500);
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return corsResponse({ error: 'An unexpected error occurred' }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}