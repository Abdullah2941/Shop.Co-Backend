# SHOP.CO Backend (Express + MongoDB, MVC)

Ek hi backend dono frontends ke liye: **website** (REACT_ASSIGNMENT_1) aur **admin panel** (Admin_-Panel).

## Setup
1. `npm install`
2. `.env.example` ko `.env` naam se copy karo aur `MONGO_URI`, `JWT_SECRET` daalo
   (Atlas URI me `.net/` ke baad database ka naam likho, jaise `.../shopco?retryWrites=true&w=majority`)
3. `npm run seed -- --reset`  -> admin user + website ke 14 products banata hai (purane products/orders hata deta hai)
   - sirf `npm run seed` : products tab hi daalta hai jab collection khali ho
4. `npm run dev`  -> http://localhost:5000

## Deploy on Vercel
1. Backend folder ko GitHub par push karo (`.env` nahi, wo `.gitignore` me hai)
2. Vercel -> Add New Project -> us repo ko import karo (Framework: **Other**, koi build command nahi)
3. Environment Variables daalo: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URLS` (dono frontend links, comma se alag), `SITE_URL` (website ka link), `JWT_EXPIRES_IN=7d`
4. Deploy. Test: `https://<backend>.vercel.app/` par `SHOP.CO API running` aana chahiye
5. Dono frontends me `VITE_API_URL=https://<backend>.vercel.app/api` daalo aur redeploy karo
6. Seed (admin + products) apne computer se chalao: `.env` me wahi `MONGO_URI` rakho, phir `npm run seed -- --reset`

Render/Railway par bhi `npm start` se chalta hai.

## Structure (MVC)
- `src/models`: User, Product, Order
- `src/controllers`: auth, product, order, user, dashboard
- `src/routes`: URL -> controller
- `src/middleware`: JWT auth, admin check, error handler

## API
Header: `Authorization: Bearer <token>`

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| POST | /api/auth/admin-login | public (sirf admin) |
| GET/PUT | /api/auth/me | user |
| GET | /api/products (keyword, category, style, tag, minPrice, maxPrice, sort, page, limit) | public |
| GET | /api/products/:id, /api/products/categories | public |
| POST/PUT/DELETE | /api/products, /api/products/:id | admin |
| POST | /api/products/:id/reviews | user |
| POST | /api/orders (items, shippingAddress, paymentMethod, promoCode) | user |
| GET | /api/orders/my | user |
| GET | /api/orders?status=, PUT /api/orders/:id/status | admin |
| GET | /api/users/customers, /api/users | admin |
| PUT/DELETE | /api/users/:id | admin |
| GET | /api/dashboard | admin |

Order me price hamesha database se liya jata hai. Shipping flat $15, promo code `SHOPCO10` = 10% off (website cart jaisa hi).
