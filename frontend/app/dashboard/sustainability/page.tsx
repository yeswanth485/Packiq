import { Suspense, lazy } from 'react'
import DashboardLoading from '../loading'

const SustainabilityClient = lazy(() => import('./SustainabilityClient'))

export default function SustainabilityPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SustainabilityClient />
    </Suspense>
  )
}
