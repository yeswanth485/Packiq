# PackIQ Backend

PackIQ is built on the **Next.js 14 App Router**. In this full-stack framework, the primary backend (API routes) securely lives within the Next.js application itself (`/frontend/app/api/...`). This tight integration is necessary for seamless cookie-based authentication with Supabase and optimal server-side rendering performance.

## What is this folder for?
This `backend/` directory acts as a dedicated space for future **microservices** or **external workers** that sit outside the Next.js stack. 

For example, you could place:
- A Python FastAPI server for advanced machine learning models or predictive packaging algorithms.
- A Node.js background job processor (like BullMQ) for processing massive async batch CSV uploads.
- Custom hardware integration endpoints that need to run locally on warehouse devices.

Currently, all core platform logic (Stripe, OpenRouter AI, DB queries) is handled inside the `frontend/` directory's `app/api/` folder.
