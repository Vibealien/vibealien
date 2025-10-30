/**
 * EditorErrorBoundary Component
 * Catches errors in the editor and prevents the entire app from crashing
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[EditorErrorBoundary] Caught error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="h-screen flex items-center justify-center bg-[#0C0C1E]">
          <div className="max-w-2xl mx-auto p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-['Orbitron'] font-bold text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-white/60 font-['Inter'] mb-6">
              The editor encountered an unexpected error. Your work has been saved automatically.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 rounded-lg bg-[#1E1E3F] border border-red-500/20 text-left">
                <p className="text-sm font-mono text-red-400 mb-2">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-white/40 font-mono">
                    <summary className="cursor-pointer hover:text-white/60">
                      Show stack trace
                    </summary>
                    <pre className="mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="border-[#7B2FF7]/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="cosmic"
                onClick={this.handleReload}
              >
                Reload Editor
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
