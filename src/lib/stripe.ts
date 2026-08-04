import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate Stripe key before initialization
if (!STRIPE_KEY || typeof STRIPE_KEY !== 'string') {
  console.error('Stripe publishable key is missing or invalid');
}

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

export async function createCheckoutSession(plan: string, price: number, interval: string, connections?: number) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Please log in before checkout so your subscription can be added to your Kristal Streams dashboard.');
    }

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan, price, interval, connections }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Checkout failed');
    }

    const { url } = await response.json();
    if (!url) throw new Error('No checkout URL returned');

    window.location.href = url;
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

void stripePromise;
