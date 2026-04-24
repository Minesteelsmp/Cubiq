import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { ProductCards } from '@/components/product-cards'
import { LandingPlans } from '@/components/landing-plans'
import { Footer } from '@/components/footer'
import { SunsetBackground } from '@/components/sunset-background'
import { sessionOptions, SessionData } from '@/lib/session'
import { query, queryOne } from '@/lib/db'
import type { SiteSettings, User, SiteSetting, Plan, WorldPlan } from '@/lib/types'

export default async function HomePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  let user: User | null = null
  if (session.isLoggedIn && session.userId) {
    user = await queryOne<User>(
      'SELECT id, email, full_name, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [session.userId]
    )
  }

  let settings: SiteSettings = {}
  try {
    const settingsRows = await query<SiteSetting[]>(
      'SELECT setting_key, setting_value FROM site_settings'
    )
    settings = settingsRows.reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value
      return acc
    }, {} as SiteSettings)
  } catch {
    // DB unavailable -- fall back to empty settings (defaults will be used)
  }

  let serverPlans: Plan[] = []
  try {
    serverPlans = await query<Plan[]>(
      'SELECT id, name, slug, price, cpu_percent, ram_mb, storage_mb FROM plans WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 8'
    )
  } catch {}

  let worldPlans: WorldPlan[] = []
  try {
    worldPlans = await query<WorldPlan[]>(
      'SELECT id, name, slug, price, description FROM world_plans WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 4'
    )
  } catch {}

  // Resolve background: admin overrides, or fallback default sunset gradient
  const bgType = settings.hero_background_type || 'gradient'
  const bgImage = settings.hero_background_image_url || ''
  const bgGradient = settings.hero_background_gradient || ''
  const showParticles = (settings.hero_show_particles ?? 'true') !== 'false'

  return (
    <div className="relative min-h-screen flex flex-col" style={{ backgroundColor: '#09090b' }}>
      {/* Fixed sunset gradient background, fades on scroll */}
      <SunsetBackground
        backgroundType={bgType}
        backgroundGradient={bgGradient}
        backgroundImageUrl={bgImage}
        showParticles={showParticles}
      />

      {/* All page content sits above the fixed background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header initialUser={user} initialSettings={settings} />

        <main className="flex-1">
          <HeroSection user={user} settings={settings} />
          <ProductCards />
          <LandingPlans serverPlans={serverPlans} worldPlans={worldPlans} />
        </main>

        <Footer settings={settings} />
      </div>
    </div>
  )
}
