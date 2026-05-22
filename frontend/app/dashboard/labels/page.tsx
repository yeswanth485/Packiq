import { Suspense, lazy } from 'react'
import DashboardLoading from '../loading'

const LabelsClient = lazy(() => import('./LabelsClient'))

export default function LabelsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <LabelsClient />
    </Suspense>
  )
}
