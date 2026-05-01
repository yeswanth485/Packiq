'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

export default function EmployeeSetup() {
  const [employees, setEmployees] = useState([{ name: '', role: '' }])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addEmployee = () => setEmployees([...employees, { name: '', role: '' }])
  const removeEmployee = (index: number) => setEmployees(employees.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Mark onboarding as complete and save count
      await supabase.from('profiles').update({ 
        onboarding_completed: true,
        employee_count: employees.length
      }).eq('id', user.id)
      
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl"
      >
        <div className="mb-8">
          <div className="flex gap-1 mb-4">
            <div className="h-1 flex-1 bg-blue-500 rounded-full" />
            <div className="h-1 flex-1 bg-blue-500 rounded-full" />
            <div className="h-1 flex-1 bg-blue-500 rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Build your Team</h1>
          <p className="text-zinc-400">Who else is working with you on PackIQ?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {employees.map((emp, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    required
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Full Name"
                    value={emp.name}
                    onChange={(e) => {
                      const newEmps = [...employees]
                      newEmps[index].name = e.target.value
                      setEmployees(newEmps)
                    }}
                  />
                  <input
                    type="text"
                    required
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Role (e.g. Logistics Manager)"
                    value={emp.role}
                    onChange={(e) => {
                      const newEmps = [...employees]
                      newEmps[index].role = e.target.value
                      setEmployees(newEmps)
                    }}
                  />
                </div>
                {employees.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeEmployee(index)}
                    className="p-2 text-zinc-500 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEmployee}
            className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm py-2 border border-zinc-800 border-dashed rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Another
          </button>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Finalizing...' : 'Finish Setup'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
