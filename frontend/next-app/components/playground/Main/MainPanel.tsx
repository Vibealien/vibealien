/**
 * Main Panel - Primary editor area
 * Inspired by solpg's main panel with split view support
 */

'use client'

import React from 'react'
import { PrimaryPanel } from './Primary/PrimaryPanel'
import { SecondaryPanel } from './Secondary/SecondaryPanel'

export function MainPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0C0C1E]">
      <div className="flex flex-1 overflow-hidden">
        <PrimaryPanel />
        <SecondaryPanel />
      </div>
    </div>
  )
}
