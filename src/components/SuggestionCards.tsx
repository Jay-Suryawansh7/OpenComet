import { Zap } from 'lucide-react'


interface SuggestionCardProps {
  slug: string
  text: string
  onClick?: () => void
}

const CARDS_DATA: SuggestionCardProps[] = [
  { slug: '/research', text: 'Search the web and summarise the latest developments on a topic' },
  { slug: '/browse', text: 'Go through a website and extract key information for me' },
  { slug: '/code', text: 'Help me write, debug, or optimise code for my project' },
  { slug: '/summarise', text: 'Summarise this page or document into key takeaways' },
]

export function SuggestionCards({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARDS_DATA.map((card) => (
          <button
            key={card.slug}
            onClick={() => onSelect(card.text)}
            className="group relative flex flex-col items-start gap-3 rounded-xl border border-white/[0.06] bg-[#161a22]/70 p-4 text-left transition-all duration-200 hover:border-white/[0.12] hover:bg-[#1a1f29] hover:shadow-lg hover:shadow-cyan-500/[0.03]"
          >
            {/* Icon + slug */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 group-hover:bg-cyan-500/15 transition-colors">
                <Zap size={12} className="text-cyan-400" />
              </div>
              <span className="text-[12px] font-medium text-white/35 group-hover:text-white/50 transition-colors">
                {card.slug}
              </span>
            </div>

            {/* Description */}
            <p className="text-[13px] leading-relaxed text-white/40 group-hover:text-white/60 transition-colors line-clamp-3">
              {card.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
