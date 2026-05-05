'use client'

import Image from 'next/image'

type Props = {
  /** Use true na primeira aba (ex.: Closet) para LCP; nas demais omita. */
  priority?: boolean
}

export default function DashboardTopBanner({ priority = false }: Props) {
  return (
    <div className="dashboard-top-banner" aria-hidden>
      <Image
        src="/logos-mia-ai/banner-1.png"
        alt=""
        fill
        className="dashboard-top-banner-img"
        sizes="100vw"
        priority={priority}
      />
    </div>
  )
}
