'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Printer, Download, Search, Box } from 'lucide-react'
import { toast } from 'sonner'
import JsBarcode from 'jsbarcode'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const TEMPLATES = [
  { id: 't1', name: 'Standard 4x6 Shipping' },
  { id: 't2', name: 'Thermal 4x6 (Minimalist)' },
  { id: 't3', name: 'FedEx Style (Mock)' },
  { id: 't4', name: 'UPS Style (Mock)' },
  { id: 't5', name: 'USPS Style (Mock)' },
  { id: 't6', name: 'Compact 4x4 (Square)' },
  { id: 't7', name: 'Warehouse Bin Label (Internal)' }
]

export default function LabelsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('t1')
  const [loading, setLoading] = useState(true)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      generateBarcode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, selectedTemplate])

  const fetchProducts = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Fetch optimized items from optimization_results
      const { data, error } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('optimized', true)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (!error && data) {
        // Dedup by SKU
        const uniqueProducts = data.reduce((acc: any[], curr: any) => {
          if (!acc.find((p: any) => p.sku === curr.sku)) {
            acc.push(curr)
          }
          return acc
        }, [] as any[])
        setProducts(uniqueProducts)
        if (uniqueProducts.length > 0) {
          setSelectedProduct(uniqueProducts[0])
        }
      }
    }
    setLoading(false)
  }

  const generateBarcode = () => {
    setTimeout(() => {
      const barcodeElements = document.querySelectorAll('.barcode-canvas')
      barcodeElements.forEach((el) => {
        JsBarcode(el, selectedProduct?.sku || 'UNKNOWN', {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          font: 'monospace',
          fontSize: 16,
          lineColor: '#000',
          margin: 10
        })
      })
    }, 100)
  }

  const downloadPDF = async () => {
    if (!labelRef.current) return
    const toastId = toast.loading('Generating PDF...')
    
    try {
      const canvas = await html2canvas(labelRef.current, { scale: 3, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: selectedTemplate === 't6' ? 'portrait' : 'portrait',
        unit: 'in',
        format: selectedTemplate === 't6' ? [4, 4] : [4, 6]
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`label_${selectedProduct?.sku || 'export'}.pdf`)
      
      toast.success('Label downloaded successfully!', { id: toastId })
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId })
    }
  }

  const renderLabel = () => {
    if (!selectedProduct) return null

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const tracking = `TRK-${Math.floor(Math.random() * 1000000000)}`
    
    // Switch based on template
    switch(selectedTemplate) {
      case 't1': // Standard 4x6
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col font-sans border-2 border-black box-border">
            <div className="flex justify-between border-b-2 border-black pb-2 mb-2">
              <div>
                <h1 className="font-bold text-lg">SHIP TO:</h1>
                <p className="text-sm font-semibold">JOHN DOE</p>
                <p className="text-sm">123 WAREHOUSE BLVD</p>
                <p className="text-sm">AUSTIN, TX 78701</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">Priority Mail</p>
                <p className="text-sm">Weight: {selectedProduct.weight} kg</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
               <canvas className="barcode-canvas"></canvas>
               <p className="text-xs text-center mt-2 font-bold tracking-widest">{tracking}</p>
            </div>
            <div className="border-t-2 border-black pt-2 mt-2">
               <p className="text-xs"><strong>Item:</strong> {selectedProduct.product_name}</p>
               <p className="text-xs"><strong>Box:</strong> {selectedProduct.optimized_box}</p>
               <p className="text-xs text-gray-500 text-right mt-2">Generated on {today}</p>
            </div>
          </div>
        )
      case 't2': // Thermal 4x6
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-white text-black p-2 flex flex-col border border-black box-border">
             <div className="flex-1 flex flex-col justify-center items-center">
                <h2 className="text-xl font-black">{selectedProduct.sku}</h2>
                <canvas className="barcode-canvas my-4"></canvas>
                <p className="text-md text-center">{selectedProduct.product_name}</p>
             </div>
             <div className="border-t border-black pt-1 text-center">
                <p className="text-xs">Box: {selectedProduct.optimized_box}</p>
             </div>
          </div>
        )
      case 't3': // FedEx Style
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col font-sans border-2 border-black box-border relative">
             <div className="absolute top-4 right-4 bg-purple-900 text-white font-bold px-4 py-1 text-2xl">E</div>
             <h1 className="text-3xl font-bold tracking-tighter text-[#4D148C]">FedEx</h1>
             <h2 className="text-xl font-black mt-1 uppercase">Express Saver</h2>
             <div className="my-4 border-y-4 border-black py-2">
                <p className="font-bold">TO: CUSTOMER</p>
                <p className="text-xs uppercase">123 MAIN ST<br/>NEW YORK, NY 10001</p>
             </div>
             <div className="flex-1 flex justify-center items-center flex-col">
                <canvas className="barcode-canvas"></canvas>
                <p className="font-bold text-lg">{tracking}</p>
             </div>
             <p className="text-xs"><strong>REF:</strong> {selectedProduct.product_name}</p>
          </div>
        )
      case 't4': // UPS Style
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col font-sans border border-black box-border">
             <div className="flex justify-between items-end border-b-2 border-black pb-2">
               <h1 className="text-2xl font-black tracking-tighter">UPS NEXT DAY AIR</h1>
               <div className="bg-black text-white px-2 py-1 font-bold text-xl">1</div>
             </div>
             <div className="mt-2 text-sm border-b-2 border-black pb-2">
                <p className="font-bold">SHIP TO:</p>
                <p>TEST USER</p>
                <p>456 DELIVERY WAY</p>
                <p>SEATTLE, WA 98101</p>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center py-4">
                <canvas className="barcode-canvas"></canvas>
             </div>
             <div className="border-t-4 border-black pt-2">
               <p className="text-xs uppercase font-bold text-center tracking-widest">{tracking}</p>
             </div>
          </div>
        )
      case 't5': // USPS Style
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-white text-black p-4 flex flex-col font-sans border-2 border-black box-border">
             <h1 className="text-center font-bold text-2xl border-b-4 border-black pb-2 uppercase tracking-tighter">USPS Priority Mail</h1>
             <div className="my-4">
                <p className="text-sm font-bold uppercase">To:</p>
                <p className="text-lg font-bold">RECIPIENT NAME</p>
                <p className="text-md">789 POSTAL AVE</p>
                <p className="text-md font-bold text-xl">CHICAGO, IL 60601</p>
             </div>
             <div className="flex-1 flex flex-col items-center justify-end">
                <canvas className="barcode-canvas scale-110 origin-bottom"></canvas>
                <p className="mt-2 text-sm font-bold tracking-[0.2em]">{tracking}</p>
             </div>
          </div>
        )
      case 't6': // Compact 4x4
        return (
          <div ref={labelRef} className="w-[4in] h-[4in] bg-white text-black p-4 flex flex-col justify-center items-center border border-black box-border">
             <p className="font-bold text-lg text-center leading-tight mb-2 uppercase">{selectedProduct.product_name}</p>
             <canvas className="barcode-canvas transform scale-90"></canvas>
             <div className="w-full border-t border-black mt-2 pt-2 text-center text-sm">
                <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                <p><strong>WT:</strong> {selectedProduct.weight}kg</p>
             </div>
          </div>
        )
      case 't7': // Warehouse Bin
        return (
          <div ref={labelRef} className="w-[4in] h-[6in] bg-yellow-300 text-black p-4 flex flex-col font-sans border-4 border-black box-border">
             <h1 className="text-center text-5xl font-black uppercase tracking-tighter mb-4">BIN A1</h1>
             <div className="bg-white flex-1 p-4 border-2 border-black flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000]">
                <h2 className="text-2xl font-bold mb-4 text-center">{selectedProduct.sku}</h2>
                <canvas className="barcode-canvas scale-125"></canvas>
                <p className="mt-6 text-lg font-bold text-center uppercase">{selectedProduct.product_name}</p>
             </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-space-grotesk text-white">Print Labels</h1>
          <p className="text-zinc-500 mt-2">Generate standard carrier or warehouse labels for your optimized SKUs.</p>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={!selectedProduct}
          className="bg-[#00FFD1] hover:bg-[#00E6BC] text-[#0A0A0F] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(0,255,209,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0D1427] border border-white/10 rounded-[32px] p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">1. Select Product</h2>
            {loading ? (
              <div className="h-12 bg-white/5 animate-pulse rounded-xl" />
            ) : products.length === 0 ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-sm">
                No optimized products found. Please run an optimization first.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">SKU / Product Name</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <select 
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#00FFD1] appearance-none"
                    value={selectedProduct?.sku || ''}
                    onChange={(e) => setSelectedProduct(products.find(p => p.sku === e.target.value))}
                  >
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} - {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0D1427] border border-white/10 rounded-[32px] p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">2. Select Template</h2>
            <div className="space-y-2">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                    selectedTemplate === template.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {template.name}
                  {selectedTemplate === template.id && <Box className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center min-h-[600px] border-dashed relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          
          {!selectedProduct ? (
            <div className="text-center space-y-4 z-10">
              <Printer className="w-16 h-16 text-zinc-600 mx-auto" />
              <p className="text-zinc-500 text-lg">Select a product to preview label</p>
            </div>
          ) : (
            <motion.div
              key={selectedTemplate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 shadow-2xl shadow-black/50"
            >
               {renderLabel()}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}
