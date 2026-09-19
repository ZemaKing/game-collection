import { LayoutGrid, List, Moon, RotateCcw, Sun } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SortMenu } from '@/features/items/components/SortMenu'
import {
  clearViewOverrides,
  getBrowserStorage,
  IMAGE_LOADING_MODES,
  type ImageLoading,
} from '@/features/settings/settings'
import { useLocale } from '@/hooks/useLocale'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { locales, type TranslationKey } from '@/lib/i18n'
import { platformNavItems } from '@/lib/navigation'

const IMAGE_LOADING_KEYS: Record<ImageLoading, { label: TranslationKey; description: TranslationKey }> = {
  lazy: { label: 'settings.imagesLazy', description: 'settings.imagesLazyHelp' },
  eager: { label: 'settings.imagesEager', description: 'settings.imagesEagerHelp' },
  saver: { label: 'settings.imagesSaver', description: 'settings.imagesSaverHelp' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="heading-section mb-1 text-text">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}

/** Label + help on one side, the control on the other; stacks on narrow screens. */
function Row({
  label,
  help,
  htmlFor,
  children,
}: {
  label: string
  help?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-3 first:pt-2 last:pb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-md">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-text">
          {label}
        </label>
        {help && <p className="mt-0.5 text-xs text-muted">{help}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingsPage() {
  const { t } = useLocale()
  const { settings, updateSettings, resetSettings } = useSettings()
  const { setTheme } = useTheme()
  const [status, setStatus] = useState<TranslationKey | null>(null)

  function handleResetViews() {
    clearViewOverrides(getBrowserStorage())
    setStatus('settings.resetViewsDone')
  }

  function handleResetAll() {
    clearViewOverrides(getBrowserStorage())
    resetSettings()
    setStatus('settings.resetAllDone')
  }

  function togglePlatform(slug: string, checked: boolean) {
    const next = checked
      ? [...settings.platformSlugs, slug]
      : settings.platformSlugs.filter((existing) => existing !== slug)
    updateSettings({ platformSlugs: next })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('nav.settings')}</h1>
        <p className="mt-1 text-sm text-muted">{t('settings.subtitle')}</p>
      </div>

      <Section title={t('settings.appearance')}>
        <Row label={t('settings.theme')}>
          <SegmentedControl
            label={t('settings.theme')}
            value={settings.theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: t('theme.light'), icon: Sun },
              { value: 'dark', label: t('theme.dark'), icon: Moon },
            ]}
          />
        </Row>
        <Row label={t('settings.language')}>
          <SegmentedControl
            label={t('settings.language')}
            value={settings.locale}
            onChange={(locale) => updateSettings({ locale })}
            options={locales.map(({ value, label }) => ({ value, label }))}
          />
        </Row>
      </Section>

      <Section title={t('settings.listings')}>
        <Row label={t('settings.defaultView')} help={t('settings.defaultViewHelp')}>
          <SegmentedControl
            label={t('settings.defaultView')}
            value={settings.viewMode}
            onChange={(viewMode) => updateSettings({ viewMode })}
            options={[
              { value: 'grid', label: t('view.gridShort'), icon: LayoutGrid },
              { value: 'list', label: t('view.listShort'), icon: List },
            ]}
          />
        </Row>
        <Row label={t('settings.resetViews')} help={t('settings.resetViewsHelp')}>
          <Button onClick={handleResetViews}>
            {t('settings.resetViewsAction')}
          </Button>
        </Row>
        <Row label={t('settings.defaultSort')} help={t('settings.defaultSortHelp')} htmlFor="settings-default-sort">
          <SortMenu
            id="settings-default-sort"
            value={settings.defaultSort}
            onChange={(defaultSort) => updateSettings({ defaultSort })}
            className="w-full sm:w-56"
          />
        </Row>
      </Section>

      <Section title={t('settings.platforms')}>
        <fieldset className="py-3 first:pt-2">
          <legend className="sr-only">{t('settings.platforms')}</legend>
          <p className="mb-3 text-xs text-muted">{t('settings.platformsHelp')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {platformNavItems.map(({ slug, label, icon: Icon }) => (
              <label
                key={slug}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text has-[:checked]:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
              >
                <input
                  type="checkbox"
                  checked={settings.platformSlugs.includes(slug)}
                  onChange={(event) => togglePlatform(slug, event.target.checked)}
                  className="size-4 accent-[var(--app-accent)]"
                />
                <Icon size={16} className="shrink-0 text-muted" />
                <span className="truncate">{label}</span>
              </label>
            ))}
          </div>
          {settings.platformSlugs.length > 0 && (
            <button
              type="button"
              onClick={() => updateSettings({ platformSlugs: [] })}
              className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t('settings.platformsShowAll')}
            </button>
          )}
        </fieldset>
      </Section>

      <Section title={t('settings.images')}>
        <fieldset className="py-3 first:pt-2">
          <legend className="sr-only">{t('settings.images')}</legend>
          <div className="flex flex-col gap-2">
            {IMAGE_LOADING_MODES.map((mode) => (
              <label
                key={mode}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg px-3 py-2.5 has-[:checked]:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
              >
                <input
                  type="radio"
                  name="image-loading"
                  value={mode}
                  checked={settings.imageLoading === mode}
                  onChange={() => updateSettings({ imageLoading: mode })}
                  className="mt-0.5 size-4 accent-[var(--app-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">{t(IMAGE_LOADING_KEYS[mode].label)}</span>
                  <span className="block text-xs text-muted">{t(IMAGE_LOADING_KEYS[mode].description)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <p role="status" aria-live="polite" className="text-xs text-muted">
          {t(status ?? 'settings.saved')}
        </p>
        <Button variant="neutral" icon={RotateCcw} onClick={handleResetAll}>
          {t('settings.resetAll')}
        </Button>
      </div>
    </div>
  )
}

export default SettingsPage
