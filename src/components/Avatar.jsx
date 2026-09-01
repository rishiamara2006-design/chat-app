export default function Avatar({ name, online, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  }

  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  const colors = [
    'bg-indigo-500',
    'bg-pink-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-teal-500',
  ]
  const color = colors[(name?.length ?? 0) % colors.length]

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`flex ${sizes[size]} ${color} items-center justify-center rounded-full font-semibold text-white`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${
            online ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  )
}
