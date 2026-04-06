import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate Stripe key before initialization
if (!STRIPE_KEY || typeof STRIPE_KEY !== 'string') {
  console.error('Stripe publishable key is missing or invalid');
}

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription' = 'payment') {
  try {
    if (!STRIPE_KEY) {
      throw new Error('Stripe has not been properly configured. Please check your environment variables.');
    }

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Failed to initialize Stripe. Please check your configuration.');

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error('Authentication error: No valid session found');
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/client/subscription?success=true`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const { url } = await response.json();
      if (!url) throw new Error('No checkout URL returned from Stripe');

      window.location.href = url;
    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
        throw new Error(
          'Unable to connect to Stripe checkout service. Please ensure you are connected to Supabase and try again.'
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function restoreSessionAfterStripe(): Promise<boolean> {
  try {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    
    // Only attempt restoration if redirected from Stripe
    if (success === 'true') {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('Failed to restore session:', refreshError);
          return false;
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error restoring session:', error);
    return false;
  }
}