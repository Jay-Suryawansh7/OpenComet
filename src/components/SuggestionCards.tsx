import { Zap } from 'lucide-react'

interface CardData {
  slug: string
  text: string
}

const CARDS: CardData[] = [
  { slug: '/add-classes', text: 'Go to my courses and add my class times to my calendar' },
  { slug: '/tldr', text: 'Summarize this page' },
  { slug: '/cite', text: 'Cite this source in MLA, APA, and Chicago formats' },
  { slug: '/order-textbooks', text: 'Go to my courses, find the textbooks I need, and add them to my school bookstore cart' },
]

export function SuggestionCards({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div className="grid grid-cols-4 gap-2.5">
        {CARDS.map((card) => (
          <button
            key={card.slug}
            onClick={() => onSelect(card.text)}
            className="group relative flex flex-col items-start gap-3 rounded-xl border border-white/[0.07] bg-[#151920] p-3.5 text-left transition-all duration-150 hover:border-white/[0.12] hover:bg-[#1a1f28]"
          >
            {/* Icon + slug */}
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/10 group-hover:bg-cyan-500/15 transition-colors">
                <Zap size={10} className="text-cyan-400" />
              </div>
              <span className="text-[11px] font-medium text-white/35 group-hover:text-white/50 transition-colors">
                {card.slug}
              </span>
            </div>

            {/* Description */}
            <p className="text-[12.5px] leading-[1.45] text-white/40 group-hover:text-white/60 transition-colors">
              {card.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
