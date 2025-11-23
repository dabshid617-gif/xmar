Marketplace Web Application – Test-Ready PRD

1. Overview
Product name: Marketplace / POS Platform (AfriPOS)
Objective: Offer a full-stack marketplace + POS system for sellers to list products, manage profiles, chat with buyers, and run in-store POS operations (online/offline) with Supabase backend.
Audience for this PRD: Third-party QA/testing teams needing clear scope and step-by-step expectations.
2. User Roles
Visitor/Buyer
Browse home, categories, product detail.
Search products, apply filters, view seller info, read reviews, start chat.
Authenticated Seller
Build profile, configure business type, enable location, create/edit products, handle POS checkout, monitor analytics.
Admin (future)
Access dashboards, review analytics (currently handled via seller-owned routes but could expand).
System
Supabase auth + backend enforcing Row-Level Security (RLS), chat notifications, analytics, offline sync.
3. Functional Scope
3.1 Authentication
Supabase Auth handles sign-in/sign-up.
Password reset flow accessible under /auth.
On successful login, session stored locally for reuse.
3.2 Home / Landing (/)
Hero search bar with location dropdown and CTA.
Category chips navigate to /category/:name.
Product grid (12 per page) with skeleton loader while data fetch in progress.
Quick stats banner + CTA to start selling.
3.3 Category page (/category/:categoryName)
Features gradient hero, search input, subcategory chips, location filter, sort dropdown, active filter chips (“Clear all”), product grid with pagination, and info section about category.
Subcategories read from product data; toggling filters updates query.
3.4 Product detail (/products/:id)
Primary image gallery with thumbnail strip and ImageLightbox.
Product info: title, price, description, rating/reviews, seller card (avatar, company, contact, optional district).
Actions: chat with seller, view variants, see “Added to cart X times”.
Related products widget and “View more” pagination.
Logging: product view writes to product_views; if viewer ≠ seller, auto message in chat conversation.
3.5 Product creation/edit (/products/new/edit, /products/:id/edit)
Business-type banner (from localStorage & Settings) influences category filtering, variant templates.
AI Analyzer (Gemini) pre-fills description/category/subcategory/variant suggestions.
Location select uses locations table, category dropdown uses categories.
Subcategory input auto-suggests values based on selected category; fallback manual input.
Variant chips toggled to create variants entries with default price.
Image upload uses Supabase Storage; preview shown in form.
Status field (active/sold/inactive), field validation (title, price, status).
Save triggers Supabase insert/update, with fallback if denormalized text columns missing.
3.6 Profile (/profile/:uid)
Hero card with avatar, display name, username badge, view count, rating, product count.
CTA buttons (edit, business settings, add product for owner; chat button for others).
Stat cards: Profile Views, Avg Rating (with counts), Active Products.
Reviews list + product grid for seller’s inventory.
Display location indicator (MapPin + district) when display_location true.
3.7 Settings (/settings)
Sections:
Business Type selection (affects ProductForm).
Receipt settings (business name, phone, logo, theme, accent color, include tax, footer). Buttons: Save, preview (order/no-order).
Store Location: toggle display location, show lat/lon/district fields, “Use My Current Location” (geolocation prompt), note on district (e.g., Abdi Asiis lat/lon window), help link.
Minimal requirements: enabling location updates profiles.latitude, .longitude, .location_name, .display_location.
3.8 POS (/pos, /pos/inventory, /pos/dashboard)
Multi-order tabs with add/close functionality.
Product grid filtered by seller’s inventory.
Cart sidebar with line selection/highlight, quantity buttons, discount fields, order-level discount, customer selection.
Numpad component changes qty/price/discount for selected line.
Payment modal handles multiple payments, split amounts, change due (only cash can overpay).
Checkout flow:
Insert orders, order_items, payments.
Load seller’s receipt settings; print preview via printHtml.
Save receipt_snapshots with order data.
Offline queue via offlineSync if offline.
Indicators for online/offline state.
3.9 Chat (/chat/:userId, /conversations)
Real-time chat via Supabase tables.
Auto creation of conversation on product view.
Chat list shows active conversations; message detail supports sending messages.
3.10 Analytics/Dashboard
/dashboard, /receipts, /orders/:id rely on Supabase queries filtered by seller; display metrics from analytics_daily, orders, receipt_snapshots.
Daily rollups maintained via refresh_daily_rollups function.
4. Non-Functional Requirements
Performance: Home/product pages should load product grid within 2s on broadband; POS interactions (cart updates, numpad inputs) near-instant (requires local state).
Reliability: Offline sync queue ensures no data loss (POS). Supabase RLS enforces owner-only data access.
Security: All requests respect RLS; only auth.uid() owner can modify their resources.
Responsiveness: Works from mobile (320px) through desktop; sticky nav and drawers adapt accordingly.
Compatibility: Latest Chrome, Firefox, Safari, Edge; mobile Safari/Chrome.
5. Backend Expectations (for testers)
Migrations under supabase/migrations establish schema.
Core tables: profiles, products, categories, locations, variants, orders, order_items, payments, analytics_daily, product_views, profile_views, product_cart_adds, pos_sessions, pos_payment_methods, receipt_settings, receipt_snapshots.
Helper functions/triggers: handle_new_user, set_view_day_utc, enforce_order_rules, refresh_daily_rollups, is_order_owner.
Testers should ensure migrations run via supabase db push.
API keys must be set in .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
POS offline storage uses IndexedDB; check src/lib/offlineSync.ts.
6. Testing Scenarios (high-level)
Auth: Sign up/in/out, password reset, error states.
Profile Setup: Update details, change avatar, test name-changing cooldown, toggle display location, capture geolocation.
Business Type: Choose type, ensure product form filters categories/variant suggestions accordingly.
Product Creation: Run through AI helper, manual entry, upload image, select location/category/subcategory, save, edit existing.
Product Detail: Verify view counts, chat creation, lightbox, reviews, related products.
Home/Category Filtering: Search, change location, subcategory chips, “Clear all”, pagination.
POS Checkout (online/offline): Add items, adjust via numpad, process multi payments, view receipts, confirm data in Supabase tables; simulate offline (disable network), create order, reconnect to sync.
Settings: Update receipt settings, preview, enable location share, confirm lat/lon/district stored.
Chat: Ensure product viewing triggers message, two-user conversation works.
Analytics Dashboard: Validate count summaries (views, orders, revenue) after running refresh_daily_rollups.
Security: Confirm unauthorized user cannot fetch others’ data (Supabase RLS), e.g., by swapping tokens or using Supabase SQL.
SEO/Meta (optional): Inspect meta tags for key pages and evaluate Lighthouse if required.
7. Deliverables for Testing Partner
Report Templates: testsprite_tests/standard_prd.json, testsprite_tests/tests…plan.json, testsprite_tests/tmp/prd_files/*.
Backend config: Supabase project ID usvfjnwgvohgnqhcttav, API key provided.
Dev server: npm run dev -- --port 8082 for local testing.
Testing Tools: TestSprite MCP (pre-configured), or manual Postman/Playwright.
Use this PRD to drive your testing plan: cover each functional area, verify RLS/security, simulate offline POS, and ensure UI/UX align with expectations.