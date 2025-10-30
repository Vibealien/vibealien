'use client'

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import { shellService, terminalService, commandManager, initializeCommands } from '@/lib'

export const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const inputBufferRef = useRef('')
  const cursorRef = useRef(0)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const promptRef = useRef('$ ')

  // ANSI color codes
  const colors = useMemo(() => ({
    success: '\x1b[1;32m',
    error: '\x1b[1;31m',
    warning: '\x1b[1;33m',
    info: '\x1b[1;34m',
    primary: '\x1b[1;35m',
    secondary: '\x1b[1;36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m'
  }), [])

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize commands first
    initializeCommands()

    const xterm = new XTerm({
      convertEol: true,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
      fontSize: 14,
      fontWeight: '400',
      fontWeightBold: '700',
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#0C0C1E',
        foreground: '#ffffff',
        cursor: '#7B2FF7',
        cursorAccent: '#ffffff',
        black: '#000000',
        red: '#e06c75',
        green: '#00FFA3',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#7B2FF7',
        cyan: '#56b6c2',
        white: '#ffffff',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#00FFA3',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#7B2FF7',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
        selectionBackground: '#7B2FF740'
      },
      allowProposedApi: true,
      scrollback: 1000
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    
    xterm.open(terminalRef.current)
    
    // Wait a tick before fitting to ensure container has proper dimensions
    setTimeout(() => {
      try {
        fitAddon.fit()
      } catch (e) {
        console.warn('Failed to fit terminal:', e)
      }
    }, 0)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Print welcome message
    printWelcome(xterm)
    printPrompt(xterm)

    // Handle resize with debounce
    let resizeTimeout: NodeJS.Timeout
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        try {
          fitAddon.fit()
        } catch (e) {
          console.warn('Failed to fit terminal on resize:', e)
        }
      }, 100)
    })
    resizeObserver.observe(terminalRef.current)

    // Handle input
    xterm.onData(handleInput)

    // Subscribe to terminal service
    const unsubscribe = terminalService.onOutput((message, type) => {
      printLine(xterm, message, type)
    })

    const unsubscribeClear = terminalService.onClear(() => {
      xterm.clear()
      printPrompt(xterm)
    })

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
      unsubscribe()
      unsubscribeClear()
      xterm.dispose()
    }
  }, [])

  const printWelcome = (xterm: XTerm) => {
    xterm.writeln(`${colors.bold}${colors.primary}Welcome to VibeAlien Terminal${colors.reset}\n`)
    xterm.writeln('Solana development made easy. Build, deploy, and test your programs.\n')
    xterm.writeln(`Type ${colors.bold}${colors.primary}help${colors.reset} to see available commands.\n`)
  }

  const printPrompt = (xterm: XTerm) => {
    const prompt = shellService.getPrompt()
    promptRef.current = prompt
    xterm.write(`${colors.primary}${prompt}${colors.reset}`)
  }

    const printLine = (xterm: XTerm, text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    // Move cursor to beginning of line and clear it (in case there's a prompt)
    xterm.write('\r\x1b[K')
    // Write the line - ANSI colors are already in the text from terminalService
    xterm.writeln(text)
  }

  const handleInput = useCallback((data: string) => {
    const xterm = xtermRef.current
    if (!xterm) return

    for (let i = 0; i < data.length; i++) {
      const code = data.charCodeAt(i)
      const char = data[i]

      // Handle different key codes
      if (code === 13) { // Enter
        handleEnter(xterm)
      } else if (code === 127) { // Backspace
        handleBackspace(xterm)
      } else if (code === 3) { // Ctrl+C
        handleCtrlC(xterm)
      } else if (code === 12) { // Ctrl+L
        handleCtrlL(xterm)
      } else if (code === 9) { // Tab
        handleTab(xterm)
      } else if (code === 27) { // Escape sequences (arrows, etc)
        if (data[i + 1] === '[') {
          const escCode = data[i + 2]
          if (escCode === 'A') { // Up arrow
            handleArrowUp(xterm)
            i += 2
          } else if (escCode === 'B') { // Down arrow
            handleArrowDown(xterm)
            i += 2
          } else if (escCode === 'C') { // Right arrow
            handleArrowRight(xterm)
            i += 2
          } else if (escCode === 'D') { // Left arrow
            handleArrowLeft(xterm)
            i += 2
          } else if (escCode === 'H') { // Home
            handleHome(xterm)
            i += 2
          } else if (escCode === 'F') { // End
            handleEnd(xterm)
            i += 2
          }
        }
      } else if (code >= 32) { // Printable characters
        handleChar(xterm, char)
      }
    }
  }, [])

  const handleEnter = async (xterm: XTerm) => {
    const input = inputBufferRef.current.trim()
    xterm.writeln('')

    if (input) {
      // Add to history
      historyRef.current.push(input)
      historyIndexRef.current = -1

      try {
        // Execute command
        await shellService.execute(input)
      } catch (error) {
        // Error already handled by shell service
      }
    }

    // Reset input
    inputBufferRef.current = ''
    cursorRef.current = 0
    
    // Print new prompt
    printPrompt(xterm)
  }

  const handleBackspace = (xterm: XTerm) => {
    const cursor = cursorRef.current
    if (cursor > 0) {
      const before = inputBufferRef.current.slice(0, cursor - 1)
      const after = inputBufferRef.current.slice(cursor)
      inputBufferRef.current = before + after
      cursorRef.current = cursor - 1

      // Redraw line
      xterm.write('\b \b')
      xterm.write(after + ' ')
      // Move cursor back
      for (let i = 0; i < after.length + 1; i++) {
        xterm.write('\b')
      }
    }
  }

  const handleChar = (xterm: XTerm, char: string) => {
    const cursor = cursorRef.current
    const before = inputBufferRef.current.slice(0, cursor)
    const after = inputBufferRef.current.slice(cursor)
    inputBufferRef.current = before + char + after
    cursorRef.current = cursor + 1

    // Write character and redraw rest of line if needed
    if (after.length === 0) {
      xterm.write(char)
    } else {
      xterm.write(char + after)
      // Move cursor back
      for (let i = 0; i < after.length; i++) {
        xterm.write('\b')
      }
    }
  }

  const handleTab = (xterm: XTerm) => {
    const input = inputBufferRef.current
    const completions = shellService.getCompletions(input)
    
    if (completions.length === 1) {
      // Auto-complete
      const completion = completions[0]
      const remaining = completion.slice(input.length)
      
      for (let i = 0; i < remaining.length; i++) {
        handleChar(xterm, remaining[i])
      }
    } else if (completions.length > 1) {
      // Show completions
      xterm.writeln('')
      xterm.writeln(completions.join('  '))
      printPrompt(xterm)
      xterm.write(input)
    }
  }

  const handleArrowUp = (xterm: XTerm) => {
    const history = historyRef.current
    let index = historyIndexRef.current

    if (index < history.length - 1) {
      index++
      historyIndexRef.current = index
      const historyCmd = history[history.length - 1 - index]
      
      // Clear current input
      clearInput(xterm)
      
      // Set new input
      inputBufferRef.current = historyCmd
      cursorRef.current = historyCmd.length
      xterm.write(historyCmd)
    }
  }

  const handleArrowDown = (xterm: XTerm) => {
    const history = historyRef.current
    let index = historyIndexRef.current

    if (index > 0) {
      index--
      historyIndexRef.current = index
      const historyCmd = history[history.length - 1 - index]
      
      // Clear current input
      clearInput(xterm)
      
      // Set new input
      inputBufferRef.current = historyCmd
      cursorRef.current = historyCmd.length
      xterm.write(historyCmd)
    } else if (index === 0) {
      historyIndexRef.current = -1
      clearInput(xterm)
      inputBufferRef.current = ''
      cursorRef.current = 0
    }
  }

  const handleArrowLeft = (xterm: XTerm) => {
    if (cursorRef.current > 0) {
      cursorRef.current--
      xterm.write('\b')
    }
  }

  const handleArrowRight = (xterm: XTerm) => {
    if (cursorRef.current < inputBufferRef.current.length) {
      xterm.write(inputBufferRef.current[cursorRef.current])
      cursorRef.current++
    }
  }

  const handleHome = (xterm: XTerm) => {
    while (cursorRef.current > 0) {
      cursorRef.current--
      xterm.write('\b')
    }
  }

  const handleEnd = (xterm: XTerm) => {
    while (cursorRef.current < inputBufferRef.current.length) {
      xterm.write(inputBufferRef.current[cursorRef.current])
      cursorRef.current++
    }
  }

  const handleCtrlC = (xterm: XTerm) => {
    xterm.writeln(`${colors.dim}^C${colors.reset}`)
    inputBufferRef.current = ''
    cursorRef.current = 0
    printPrompt(xterm)
  }

  const handleCtrlL = (xterm: XTerm) => {
    xterm.clear()
    printPrompt(xterm)
    xterm.write(inputBufferRef.current)
  }

  const clearInput = (xterm: XTerm) => {
    const len = inputBufferRef.current.length
    for (let i = 0; i < len; i++) {
      xterm.write('\b \b')
    }
  }

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-[calc(100%-2rem)] terminal-container"
      style={{ 
        padding: '0.5rem 1rem',
        backgroundColor: '#0C0C1E',
        overflow: 'hidden',
        maxHeight: '100%',
        minHeight: '100%'
      }}
    />
  )
}