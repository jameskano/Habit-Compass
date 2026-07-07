import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'

import { onboardingSlides } from './onboarding.constants'
import { useCompleteOnboarding } from './useCompleteOnboarding'

const swipeThreshold = 48

export const OnboardingPage = () => {
  const intl = useIntl()
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const pointerStartXRef = useRef<number | null>(null)
  const { completeOnboarding, completionError, isCompleting } = useCompleteOnboarding()
  const slideCount = onboardingSlides.length
  const activeSlide = onboardingSlides[activeSlideIndex]
  const isFirstSlide = activeSlideIndex === 0
  const isFinalSlide = activeSlideIndex === slideCount - 1

  const goToSlide = (nextIndex: number) => {
    setActiveSlideIndex(Math.min(slideCount - 1, Math.max(0, nextIndex)))
  }

  const goToPreviousSlide = () => {
    goToSlide(activeSlideIndex - 1)
  }

  const goToNextSlide = () => {
    goToSlide(activeSlideIndex + 1)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    pointerStartXRef.current = event.clientX
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) {
      return
    }

    const deltaX = event.clientX - pointerStartXRef.current
    pointerStartXRef.current = null

    if (Math.abs(deltaX) < swipeThreshold) {
      return
    }

    if (deltaX > 0) {
      goToPreviousSlide()
      return
    }

    goToNextSlide()
  }

  const handlePointerCancel = () => {
    pointerStartXRef.current = null
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-3xl items-center">
      <Card className="w-full overflow-hidden rounded-2xl p-0">
        <div
          aria-label={intl.formatMessage({ id: 'onboarding.carousel.aria' })}
          aria-roledescription={intl.formatMessage({ id: 'onboarding.carousel.role' })}
          className="space-y-6 p-5 sm:p-6"
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerCancel}
          onPointerUp={handlePointerUp}
          role="region"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <FormattedMessage
                id="onboarding.progress"
                values={{ current: activeSlideIndex + 1, total: slideCount }}
              />
            </p>
            <p aria-live="polite" className="sr-only">
              <FormattedMessage
                id="onboarding.screenReaderProgress"
                values={{
                  current: activeSlideIndex + 1,
                  title: intl.formatMessage({ id: activeSlide.titleId }),
                  total: slideCount,
                }}
              />
            </p>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
            >
              {onboardingSlides.map((slide, index) => {
                const Icon = slide.icon
                const isActive = index === activeSlideIndex

                return (
                  <article
                    aria-hidden={!isActive}
                    className="min-w-full space-y-5 pr-1"
                    key={slide.titleId}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="h-7 w-7" />
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-2xl font-semibold leading-tight text-foreground">
                        <FormattedMessage id={slide.titleId} />
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                        <FormattedMessage id={slide.bodyId} />
                      </p>
                    </div>

                    <ul className="grid gap-3">
                      {slide.points.map((pointId) => (
                        <li
                          className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 text-sm leading-5 text-foreground"
                          key={pointId}
                        >
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 flex-none text-primary"
                          />
                          <span>
                            <FormattedMessage id={pointId} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>

          <div
            aria-label={intl.formatMessage({ id: 'onboarding.pagination.aria' })}
            className="flex justify-center gap-2"
            role="group"
          >
            {onboardingSlides.map((slide, index) => {
              const isActive = index === activeSlideIndex
              const title = intl.formatMessage({ id: slide.titleId })

              return (
                <button
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={intl.formatMessage(
                    { id: 'onboarding.goToSlide.aria' },
                    { number: index + 1, title },
                  )}
                  className={cn(
                    'h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive ? 'w-8 bg-primary' : 'w-2.5 bg-muted-foreground/35',
                  )}
                  key={slide.titleId}
                  onClick={() => goToSlide(index)}
                  type="button"
                />
              )
            })}
          </div>

          {completionError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <FormattedMessage id="onboarding.completionError" />
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button
              className="rounded-full"
              disabled={isFirstSlide || isCompleting}
              onClick={goToPreviousSlide}
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" className="mr-2 h-4 w-4" />
              <FormattedMessage id="action.back" />
            </Button>

            {isFinalSlide ? (
              <Button
                className="rounded-full"
                disabled={isCompleting}
                onClick={() => void completeOnboarding()}
              >
                <Check aria-hidden="true" className="mr-2 h-4 w-4" />
                <FormattedMessage id={isCompleting ? 'action.finishing' : 'action.finish'} />
              </Button>
            ) : (
              <Button className="rounded-full" disabled={isCompleting} onClick={goToNextSlide}>
                <FormattedMessage id="action.next" />
                <ChevronRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}
