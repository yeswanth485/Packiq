import { Suspense, lazy } from 'react'
import DashboardLoading from '../loading'

const OptimizationClient = lazy(() => import('./OptimizationClient'))

export default function OptimizationPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <OptimizationClient />
    </Suspense>
  )
}
