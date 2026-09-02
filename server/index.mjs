import { createClerkClient, verifyToken } from '@clerk/backend';
import express from 'express';
import Stripe from 'stripe';

const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CLERK_SECRET_KEY', 'APP_RETURN_URL'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const app = express();
const port = Number(process.env.BILLING_PORT ?? 4242);
const activeStatuses = new Set(['active', 'trialing']);

function getPrice(interval) {
  if (interval === 'month') return process.env.STRIPE_PRICE_MONTHLY;
  if (interval === 'year') return process.env.STRIPE_PRICE_YEARLY;
  return undefined;
}

async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

async function billingMetadata(userId) {
  const user = await clerk.users.getUser(userId);
  return user.privateMetadata?.billing ?? {};
}

async function saveBillingMetadata(userId, billing) {
  await clerk.users.updateUserMetadata(userId, { privateMetadata: { billing } });
}

async function syncSubscription(subscription) {
  const userId = subscription.metadata.clerkUserId;
  if (!userId) return;

  await saveBillingMetadata(userId, {
    stripeCustomerId: String(subscription.customer),
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? null,
    currentPeriodEnd: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
  });
}

// Stripe needs the exact raw request body to validate the signature.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).send('Missing Stripe signature.');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Invalid webhook signature: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.subscription) {
        await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await syncSubscription(event.data.object);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Unable to process Stripe event', event.id, error);
    res.status(500).json({ error: 'Unable to process webhook.' });
  }
});

app.use(express.json());

app.get('/api/billing/status', requireUser, async (req, res) => {
  try {
    const billing = await billingMetadata(req.userId);
    if (!billing.stripeSubscriptionId) return res.json({ subscribed: false, status: null });

    const subscription = await stripe.subscriptions.retrieve(billing.stripeSubscriptionId);
    await syncSubscription(subscription);
    res.json({
      subscribed: activeStatuses.has(subscription.status),
      status: subscription.status,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error) {
    console.error('Unable to retrieve billing status', error);
    res.status(500).json({ error: 'Unable to retrieve billing status.' });
  }
});

app.post('/api/billing/checkout', requireUser, async (req, res) => {
  const price = getPrice(req.body.interval);
  if (!price) return res.status(400).json({ error: 'Invalid or unconfigured billing interval.' });

  try {
    const billing = await billingMetadata(req.userId);
    const customer = billing.stripeCustomerId
      ? billing.stripeCustomerId
      : (await stripe.customers.create({ metadata: { clerkUserId: req.userId } })).id;

    if (!billing.stripeCustomerId) await saveBillingMetadata(req.userId, { ...billing, stripeCustomerId: customer });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: req.userId,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { clerkUserId: req.userId } },
      success_url: `${process.env.APP_RETURN_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_RETURN_URL}?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Unable to create Checkout session', error);
    res.status(500).json({ error: 'Unable to start checkout.' });
  }
});

app.post('/api/billing/portal', requireUser, async (req, res) => {
  try {
    const { stripeCustomerId } = await billingMetadata(req.userId);
    if (!stripeCustomerId) return res.status(400).json({ error: 'No billing customer found.' });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.APP_RETURN_URL,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Unable to create customer portal session', error);
    res.status(500).json({ error: 'Unable to open billing portal.' });
  }
});

app.listen(port, () => console.log(`Billing API listening on port ${port}`));
