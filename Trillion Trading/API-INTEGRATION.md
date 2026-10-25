# External API integration

This project is frontend only. It uses TanStack Start's platform routing and React UI; it contains no business backend or database.

Set `VITE_API_BASE_URL` to the external Express API origin. Public business configuration is in `src/config/site.ts`. Never add private Razorpay keys to any frontend environment variable.

## Contracts

- `GET /api/site-settings`, `/api/courses`, `/api/software`: public business content.
- `GET /api/reports`: `Report[]`, newest first in the UI. `GET /api/reports/:id`: one report. Fields: id, title, description, ISO date, category, imageUrl, optional downloadUrl. Categories match the business names.
- `POST /api/contact`, `/api/trial-requests`: validated form data; return `{ message }` after real acceptance. Trial requests do not imply access approval.
- `POST /api/coupons/validate`: `{ business, product, code }`; return `{ valid, code, discount, originalAmount, payableAmount, message? }`. Amounts here are rupees. Backend validates product ownership, eligibility, expiry, and non-stacking.
- `POST /api/trillion/orders`, `/api/right-algo/orders`: `{ product, customer, coupon?, registrationId? }`; return `{ keyId, orderId, amount, currency, business }`. Razorpay `amount` is in paise. Backend selects the dedicated business account and computes final prices.
- `POST /api/trillion/payments/verify`, `/api/right-algo/payments/verify`: Razorpay response; backend verifies signature, amount, payment status, and idempotent fulfillment. Return a `VerifiedOrder`.
- `GET /api/trillion/orders/:id`, `/api/right-algo/orders/:id`: caller-authorized verified order. `VerifiedOrder.amount` is in rupees; fields include verified, business, product, paymentId, orderId, receiptUrl?, onboarding?, membershipEligible?. Product IDs are LEVEL_1, LEVEL_2, COURSE_PACKAGE, SOFTWARE, REGISTRATION.
- `GET /api/trillion/receipts/:id`: authorized backend-generated receipt URL. Both businesses may provide a receiptUrl directly in verified orders.
- `POST /api/right-algo/register`: validated registration, password, terms and risk acceptance; creates pending registration and returns `{ registrationId }`, never grants membership by itself.
- `POST /api/right-algo/login`: `{ identity, password }`; authenticated cookie session and `{ authenticated: true }` only after actual authorization.
- `POST /api/right-algo/logout`, `/api/right-algo/forgot-password`.
- `GET /api/right-algo/me`: authorized member profile. `/api/right-algo/membership`: active, registrationVerified, paymentVerified, status, paymentStatus. All three eligibility flags must be true to render protected content.

## Security and deployment

Use secure HTTP-only session cookies, explicit credentialed CORS for the website origin, CSRF protection, server validation, password hashing, rate limits, and payment webhook verification. The client sends `X-CSRF-Token` from a `csrf_token` cookie when available. Session and password secrets are never stored in localStorage. Protect every order, receipt, member, and future admin endpoint on the backend.

`/admin/reports` is a disabled preparation screen only. Enable uploads only after implementing real admin authorization and persisted file storage externally. Never replace it with temporary browser storage.

Frontend tests and live browser checks cover public pages, mobile navigation, validation, disconnected errors, and denied paid access. Real authenticated, coupon, receipt, and payment flows cannot be verified until an external API is connected. No live success has been simulated.