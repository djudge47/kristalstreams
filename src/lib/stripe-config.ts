export const products = {
  basic: {
    monthly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Basic Plan (Monthly)',
      description: 'Basic streaming package with 1 connection',
      mode: 'subscription' as const
    },
    yearly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Basic Plan (Yearly)',
      description: 'Basic streaming package with 1 connection',
      mode: 'subscription' as const
    }
  },
  standard: {
    monthly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Standard Plan (Monthly)',
      description: 'Enhanced streaming package with 2 connections',
      mode: 'subscription' as const
    },
    yearly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Standard Plan (Yearly)',
      description: 'Enhanced streaming package with 2 connections',
      mode: 'subscription' as const
    }
  },
  premium: {
    monthly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Premium Plan (Monthly)',
      description: 'Premium streaming package with 4 connections',
      mode: 'subscription' as const
    },
    yearly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Premium Plan (Yearly)',
      description: 'Premium streaming package with 4 connections',
      mode: 'subscription' as const
    }
  },
  ultimate: {
    monthly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Ultimate Plan (Monthly)',
      description: 'Ultimate streaming package with all features',
      mode: 'subscription' as const
    },
    yearly: {
      priceId: 'price_1RMDCDH5y1cguXFGnLoGN0rt',
      name: 'Ultimate Plan (Yearly)',
      description: 'Ultimate streaming package with all features',
      mode: 'subscription' as const
    }
  }
} as const;

export type ProductId = keyof typeof products;
export type BillingInterval = 'monthly' | 'yearly';

export interface ProductConfig {
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
}

export function getProductConfig(productId: ProductId, interval: BillingInterval): ProductConfig {
  if (!products[productId] || !products[productId][interval]) {
    throw new Error(`Invalid product configuration: ${productId} - ${interval}`);
  }
  return products[productId][interval];
}