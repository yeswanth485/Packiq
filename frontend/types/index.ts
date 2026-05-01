// ============================================================
// PackIQ — Central Type Definitions
// ============================================================

export type Plan = 'free' | 'pro' | 'enterprise'
export type OptimizationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

// ─── Database Row Types ─────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  company: string | null
  company_domain: string | null
  employee_count: number | null
  onboarding_completed: boolean
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  optimizations_used: number
  optimizations_limit: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  sku: string | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  fragile: boolean
  category: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BoxCatalog {
  id: string
  name: string
  supplier: string | null
  sku: string | null
  length_cm: number
  width_cm: number
  height_cm: number
  max_weight_kg: number | null
  cost_usd: number | null
  material: string | null
  eco_certified: boolean
  in_stock: boolean
  created_at: string
}

export interface Optimization {
  id: string
  user_id: string
  product_id: string | null
  box_id: string | null
  status: OptimizationStatus
  product_snapshot: Record<string, unknown> | null
  ai_response: Record<string, unknown> | null
  recommended_box: string | null
  efficiency_score: number | null
  space_utilization: number | null
  cost_savings_usd: number | null
  co2_savings_kg: number | null
  ai_model: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface Order {
  id: string
  user_id: string
  product_id: string | null
  optimization_id: string | null
  box_id: string | null
  status: OrderStatus
  tracking_number: string | null
  carrier: string | null
  quantity: number
  total_cost_usd: number | null
  destination: {
    address: string
    city: string
    country: string
    zip: string
  } | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

// ─── Database Utility Type ─────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      box_catalog: { Row: BoxCatalog; Insert: Partial<BoxCatalog>; Update: Partial<BoxCatalog> }
      optimizations: { Row: Optimization; Insert: Partial<Optimization>; Update: Partial<Optimization> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
    }
  }
}

// ─── API Payloads ───────────────────────────────────────────

export interface OptimizeRequest {
  productId: string
}

export interface UploadedProduct {
  name: string
  sku?: string
  weight_kg?: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  fragile?: boolean
  category?: string
  notes?: string
}

// ─── Dashboard Stats ────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number
  totalOptimizations: number
  totalSavingsUsd: number
  totalCo2Saved: number
  avgEfficiency: number
  recentOptimizations: Optimization[]
}
