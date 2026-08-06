type LogoSize = 'sm' | 'md' | 'lg'

const sizeConfig = {
  sm: { icon: 24, svg: 10, strokeWidth: 2,   text: 'text-sm',  gap: 'gap-2', rounded: 'rounded-md' },
  md: { icon: 32, svg: 14, strokeWidth: 2.2, text: 'text-lg',  gap: 'gap-3', rounded: 'rounded-lg' },
  lg: { icon: 44, svg: 18, strokeWidth: 2.4, text: 'text-2xl', gap: 'gap-4', rounded: 'rounded-xl' },
}

export function LogoIcon({ size = 'md' }: { size?: LogoSize }) {
  const s = sizeConfig[size]
  return (
    <div
      className={`bg-brand-green ${s.rounded} flex items-center justify-center`}
      style={{ width: s.icon, height: s.icon }}
    >
      <svg
        width={s.svg} height={s.svg}
        viewBox="0 0 14 14" fill="none"
        stroke="#0b1a06"
        strokeWidth={s.strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M2 10L5.5 6.5L8 9L12 4"/>
      </svg>
    </div>
  )
}

export function LogoText({ size = 'md' }: { size?: LogoSize }) {
  const s = sizeConfig[size]
  return (
    <span className={`text-brand-text font-extrabold ${s.text}`}>
      Fi<span className="text-brand-green">napse</span>
    </span>
  )
}

export function FullLogo({ size = 'md' }: { size?: LogoSize }) {
  return (
    <div className={`flex items-center ${sizeConfig[size].gap} pl-4`}>
      <LogoIcon size={size} />
      <LogoText size={size} />
    </div>
  )
}