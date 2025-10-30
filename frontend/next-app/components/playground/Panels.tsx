/**
 * Playground Panels - Main Layout Structure
 * Inspired by Solana Playground's three-panel design
 * Adapted for Next.js with Tailwind CSS
 */

'use client'

import React from 'react'
import { SidePanel } from './Side/SidePanel'
import { MainPanel } from './Main/MainPanel'
import { BottomPanel } from './Bottom/BottomPanel'

export function PlaygroundPanels() {
  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden bg-[#0C0C1E]">
      {/* Top Section: Side + Main */}
      <div className="flex flex-1 overflow-hidden w-full">
        <SidePanel />
        <MainPanel />
      </div>

      {/* Bottom Panel */}
      <BottomPanel />
    </div>
  )
}
