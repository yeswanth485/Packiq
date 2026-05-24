import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    outline: 'bg-transparent border-white/10 text-zinc-400'
  }

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
