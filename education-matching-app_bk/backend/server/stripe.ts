import Stripe from 'stripe';
import { DEFAULT_STRIPE_SECRET_KEY, DEFAULT_STRIPE_WEBHOOK_SECRET } from './constants/env';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || DEFAULT_STRIPE_SECRET_KEY;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables, using default test key');
}

// Create Stripe instance
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
});

// Helper function to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return true; // Always configured with default key
}

// Webhook secret for verifying webhook signatures
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || DEFAULT_STRIPE_WEBHOOK_SECRET;
