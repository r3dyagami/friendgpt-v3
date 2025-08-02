// Simple Node.js server for Stripe integration
// This handles creating checkout sessions and webhooks

const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY'); // Replace with your secret key
const app = express();

app.use(express.json());
app.use(express.static('.')); // Serve your HTML files

// CORS headers for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    const { amount, priceInCents } = req.body;
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${amount} Energy Credits`,
                        description: 'FriendGPT Energy Credits',
                    },
                    unit_amount: priceInCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&credits=${amount}`,
            cancel_url: `${req.headers.origin}/index.html`,
            metadata: {
                credits: amount
            }
        });
        
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint to handle successful payments
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_YOUR_WEBHOOK_SECRET'; // Replace with your webhook secret
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const credits = parseInt(session.metadata.credits);
        
        // Here you would update your database with the purchased credits
        console.log(`Payment successful! User purchased ${credits} credits`);
        console.log('Session ID:', session.id);
        console.log('Customer email:', session.customer_email);
        
        // In production, update your database here
    }
    
    res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Make sure to update your Stripe keys in this file!`);
});