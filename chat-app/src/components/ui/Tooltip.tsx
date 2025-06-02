import { useState } from 'react'

import { observer } from 'mobx-react-lite'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export const Tooltip = observer(
  ({ content, children, position = 'top', delay = 200 }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false)
    let timeout: NodeJS.Timeout

    const showTooltip = () => {
      timeout = setTimeout(() => {
        setIsVisible(true)
      }, delay)
    }

    const hideTooltip = () => {
      clearTimeout(timeout)
      setIsVisible(false)
    }

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    }

    return (
      <div
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
        {isVisible && (
          <div
            className={`absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg ${positionClasses[position]}`}
            role="tooltip"
          >
            {content}
            <div
              className={`absolute h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-900 ${
                position === 'top'
                  ? 'bottom-[-2px] left-1/2'
                  : position === 'right'
                    ? 'left-[-2px] top-1/2 -translate-y-1/2'
                    : position === 'bottom'
                      ? 'left-1/2 top-[-2px]'
                      : 'right-[-2px] top-1/2 -translate-y-1/2'
              }`}
            />
          </div>
        )}
      </div>
    )
  }
)
