'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, Table as TableIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { optimizeProduct } from '@/lib/optimization/engine'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { Badge } from '@/components/ui/Badge'

export default function OptimizePage() {
  const router = useRouter()
  const supabase = createClient()
  const { setCurrentRun, setResults, setIsOptimizing } = useOptimizationStore()

  const [step, setStep] = useState(1) // 1: Upload, 2: Preview, 3: Processing
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateData(results.data)
      },
      error: (error) => {
        toast.error('Failed to parse CSV: ' + error.message)
      }
    })
  }

  const validateData = (data: any[]) => {
    const newErrors: string[] = []
    const validatedData = data.map((row, index) => {
      const productName = row.product_name || row.ProductName
      const length = parseFloat(row.length_cm || row.Length)
      const width = parseFloat(row.width_cm || row.Width)
      const height = parseFloat(row.height_cm || row.Height)
      const weight = parseFloat(row.weight_kg || row.Weight)
      const fragility = (row.fragility || row.Fragility || 'low').toLowerCase()
      const quantity = parseInt(row.quantity || row.Quantity || '1')

      if (!productName) newErrors.push(`Row ${index + 1}: Missing product name`)
      if (isNaN(length) || length <= 0) newErrors.push(`Row ${index + 1}: Invalid length`)
      if (isNaN(width) || width <= 0) newErrors.push(`Row ${index + 1}: Invalid width`)
      if (isNaN(height) || height <= 0) newErrors.push(`Row ${index + 1}: Invalid height`)
      if (isNaN(weight) || weight <= 0) newErrors.push(`Row ${index + 1}: Invalid weight`)
      if (!['low', 'medium', 'high'].includes(fragility)) newErrors.push(`Row ${index + 1}: Invalid fragility (must be low, medium, or high)`)

      return {
        product_name: productName,
        original_length_cm: length,
        original_width_cm: width,
        original_height_cm: height,
        original_weight_kg: weight,
        fragility,
        quantity
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setStep(1)
    } else {
      setErrors([])
      setParsedData(validatedData)
      setStep(2)
    }
  }

  const runOptimization = async () => {
    setStep(3)
    setIsOptimizing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: company } = await (supabase as any)
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      // Fetch custom box catalog
      const { data: customBoxes } = await (supabase as any)
        .from('box_catalog')
        .select('*')
        .eq('user_id', user.id)

      // 1. Parsing (10%)
      setProgress(10)
      setProgressText('Initializing engine...')
      await new Promise(r => setTimeout(r, 800))

      // 2. Running FFD (40%)
      setProgress(40)
      setProgressText('Running FFD algorithm...')
      const results = parsedData.map(p => optimizeProduct(p, customBoxes || []))
      await new Promise(r => setTimeout(r, 1200))

      // 3. Calculating savings (70%)
      setProgress(70)
      setProgressText('Calculating savings & CO2 impact...')
      const totalSavings = results.reduce((acc, r) => acc + r.savings_inr, 0)
      const avgUtilization = results.reduce((acc, r) => acc + r.space_utilization_percent, 0) / results.length
      const totalCo2 = results.reduce((acc, r) => acc + r.co2_saved_kg, 0)
      await new Promise(r => setTimeout(r, 1000))

      // 4. Saving to DB (90%)
      setProgress(90)
      setProgressText('Saving results to database...')

      const { data: session, error: sessionError } = await (supabase as any)
        .from('optimization_sessions')
        .insert({
          user_id: user.id,
          file_name: file?.name || 'Manual Upload',
          file_size_bytes: file?.size || 0,
          total_items: results.length,
          optimized_items: results.length,
          unoptimized_items: 0,
          optimization_rate: 100,
          estimated_savings: totalSavings,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const dbResults = results.map(r => ({
        session_id: session.id,
        user_id: user.id,
        sku: r.product_name.replace(/\\s+/g, '-').toLowerCase() + '-' + Math.floor(Math.random()*1000),
        product_name: r.product_name,
        length_cm: r.original_length_cm,
        width_cm: r.original_width_cm,
        height_cm: r.original_height_cm,
        weight_kg: r.original_weight_kg,
        quantity: r.quantity,
        is_optimized: true,
        old_box_cost: r.original_box_price_inr,
        new_box_name: r.optimized_box_name,
        new_box_cost: r.optimized_box_price_inr,
        new_box_length_cm: r.optimized_length_cm,
        new_box_width_cm: r.optimized_width_cm,
        new_box_height_cm: r.optimized_height_cm,
        volume_utilization: r.space_utilization_percent,
        savings_pct: r.savings_percent,
        savings_amount: r.savings_inr,
        fragility_score: r.fragility_score,
        fragility_level: r.fragility,
        risk_score: r.risk_score
      }))

      const { error: resultsError } = await (supabase as any)
        .from('optimization_results')
        .insert(dbResults)

      if (resultsError) throw resultsError

      // 5. Complete (100%)
      setProgress(100)
      setProgressText('Optimization Complete!')

      setCurrentRun(session)
      setResults(dbResults as any)

      toast.success('Successfully optimized ' + results.length + ' products')

      setTimeout(() => {
        setIsOptimizing(false)
        router.push('/dashboard/orders')
      }, 1500)

    } catch (error: any) {
      console.error(error)
      toast.error('Optimization failed: ' + error.message)
      setStep(2)
      setIsOptimizing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = Papa.unparse([{
      product_name: 'Wireless Mouse',
      length_cm: 12.5,
      width_cm: 8.2,
      height_cm: 4.5,
      weight_kg: 0.15,
      fragility: 'low',
      quantity: 1
    }])
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shipzi_template.csv'
    a.click()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-space-grotesk text-white">Optimize Catalog</h1>
        <p className="text-zinc-500">Upload your product catalog CSV to find the perfect packaging for every item.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div
              className="border-2 border-dashed border-white/10 rounded-[40px] p-20 flex flex-col items-center justify-center space-y-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-blue-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-white">Drop your CSV here or click to browse</p>
                <p className="text-zinc-500">Support for large catalogs (up to 10,000 SKUs)</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Don't have a file?</p>
                  <p className="text-sm text-zinc-500">Download our sample template to get started.</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {errors.length > 0 && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  Validation Errors Found
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {errors.slice(0, 6).map((err, i) => (
                    <div key={i} className="text-sm text-red-400/80">• {err}</div>
                  ))}
                  {errors.length > 6 && <div className="text-sm text-red-400/80 font-bold">+ {errors.length - 6} more errors</div>}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <TableIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Preview Data</h3>
                  <p className="text-sm text-zinc-500">{parsedData.length} valid rows found</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-zinc-400 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={runOptimization}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-2"
                >
                  Start Optimization
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#0D1427] border border-white/5 rounded-[32px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Product Name</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Dimensions</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Weight</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Fragility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{row.product_name}</td>
                        <td className="px-6 py-4 text-zinc-400">{row.original_length_cm}x{row.original_width_cm}x{row.original_height_cm} cm</td>
                        <td className="px-6 py-4 text-zinc-400">{row.original_weight_kg} kg</td>
                        <td className="px-6 py-4">
                          <Badge variant={row.fragility === 'high' ? 'red' : row.fragility === 'medium' ? 'yellow' : 'green'}>
                            {row.fragility}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <div className="p-4 text-center text-xs font-bold text-zinc-600 uppercase tracking-widest bg-black/20">
                  Showing first 10 of {parsedData.length} rows
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center space-y-12"
          >
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - progress / 100) }}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                <span className="text-4xl font-black font-space-grotesk text-white">{progress}%</span>
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold font-space-grotesk text-white">{progressText}</h2>
              <div className="flex gap-2">
                {[10, 40, 70, 90, 100].map(s => (
                  <div
                    key={s}
                    className={`h-1.5 w-12 rounded-full transition-all duration-500 ${progress >= s ? 'bg-blue-500' : 'bg-white/5'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
