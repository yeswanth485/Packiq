import { Suspense, lazy } from 'react'
import DashboardLoading from './loading'

const DashboardClient = lazy(() => import('@/components/dashboard/DashboardClient'))

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  )
}
