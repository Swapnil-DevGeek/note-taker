import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'

export const CommandsList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-black border border-zinc-800 rounded-lg shadow-2xl overflow-hidden w-72 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50">
        Basic Blocks
      </div>
      <div className="flex flex-col p-1 max-h-80 overflow-y-auto custom-scrollbar">
        {props.items.length > 0 ? (
          props.items.map((item: any, index: number) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 text-left rounded-md transition-all duration-200",
                index === selectedIndex 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              )}
            >
              <div className={cn(
                "w-9 h-9 flex items-center justify-center rounded border",
                index === selectedIndex ? "border-zinc-700 bg-zinc-800" : "border-zinc-800 bg-zinc-900/50"
              )}>
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-none mb-0.5">{item.title}</span>
                <span className="text-[11px] text-zinc-500 line-clamp-1">{item.description}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-zinc-500 italic">
            No results
          </div>
        )}
      </div>
    </div>
  )
})

CommandsList.displayName = 'CommandsList'
