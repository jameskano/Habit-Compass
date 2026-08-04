import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { CalendarRange, ListTodo, SunMedium } from 'lucide-react'
import type { MouseEvent } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { useIsNativeAndroid } from '@/shared/nativeBack/useIsNativeAndroid'

const navItems = [
  { to: '/today', icon: SunMedium, labelId: 'nav.today' },
  { to: '/week', icon: CalendarRange, labelId: 'nav.week' },
  { to: '/items', icon: ListTodo, labelId: 'nav.items' },
] as const

export const BottomNav = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const isNativeAndroid = useIsNativeAndroid()

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    to: (typeof navItems)[number]['to'],
  ) => {
    if (
      !isNativeAndroid ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return
    }

    event.preventDefault()
    void navigate({ replace: true, to })
  }

  return (
    <nav
      aria-label={intl.formatMessage({ id: 'nav.primary' })}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:backdrop-blur-none"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-around px-3 py-2 md:justify-start md:gap-2 md:px-0 md:py-0">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  'bg-primary text-primary-foreground shadow-sm md:bg-primary/15 md:text-foreground',
              }}
              onClick={(event) => handleNavClick(event, item.to)}
              className="flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted md:min-w-0 md:flex-row md:px-4"
            >
              <Icon aria-hidden="true" size={18} />
              <span>
                <FormattedMessage id={item.labelId} />
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
