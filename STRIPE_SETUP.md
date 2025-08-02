# Stripe Payment Setup Guide

## Quick Setup (Test Mode)

1. **Create a Stripe Account**
   - Go to https://stripe.com and sign up
   - No approval needed for test mode

2. **Get Your API Keys**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

3. **Update Your Code**
   - In `index.html`, replace `pk_test_YOUR_STRIPE_PUBLISHABLE_KEY` with your publishable key
   - In `stripe-server.js`, replace `sk_test_YOUR_STRIPE_SECRET_KEY` with your secret key

4. **Install Dependencies**
   ```bash
   npm init -y
   npm install express stripe
   ```

5. **Run the Server**
   ```bash
   node stripe-server.js
   ```

6. **Update Frontend**
   - In `index.html`, replace `YOUR_SERVER_ENDPOINT` with `http://localhost:3000`

7. **Test Payments**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date and any 3-digit CVC

## Production Setup

1. **Switch to Live Mode**
   - Get live API keys from https://dashboard.stripe.com/apikeys
   - Replace test keys with live keys

2. **Set Up Webhooks** (Optional but recommended)
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/webhook`
   - Select events: `checkout.session.completed`
   - Copy webhook secret and update `stripe-server.js`

3. **Deploy Server**
   - Deploy `stripe-server.js` to your hosting service
   - Update `YOUR_SERVER_ENDPOINT` in `index.html` to your server URL

## Alternative: Stripe Payment Links (No Server Needed)

If you don't want to run a server:

1. Go to https://dashboard.stripe.com/payment-links
2. Create payment links for each energy package
3. Replace the checkout buttons with simple links:
   ```html
   <a href="YOUR_STRIPE_PAYMENT_LINK" class="stripe-checkout-btn">Buy Now</a>
   ```

## Security Notes

- Never expose your secret key in client-side code
- Always validate webhook signatures
- Use environment variables for API keys in production
- Enable HTTPS for production deployments