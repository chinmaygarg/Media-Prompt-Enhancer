export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'DEBUG' | 'ERROR' | 'WARN'
  component: string
  event: string
  input?: any
  output?: any
  debug?: any
  error?: string
  sessionId?: string
}

class Logger {
  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }, null, 2) + '\n\n'
  }

  private writeToFile(filename: string, entry: LogEntry) {
    try {
      // Server-side logging - only works in API routes
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        const logsDir = path.join(process.cwd(), 'logs')
        
        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true })
        }
        
        const filePath = path.join(logsDir, filename)
        const logEntry = this.formatLogEntry(entry)
        
        // Append to file (create if doesn't exist)
        fs.appendFileSync(filePath, logEntry)
      }
    } catch (error) {
      console.error('[Logger] Failed to write log:', error)
    }
  }

  // API Logging
  logGenerateQuestions(level: LogEntry['level'], event: string, data: {
    input?: any
    output?: any
    debug?: any
    error?: string
    sessionId?: string
  }) {
    this.writeToFile('generate-questions.log', {
      timestamp: new Date().toISOString(),
      level,
      component: 'GenerateQuestionsAPI',
      event,
      ...data
    })
  }

  logEnhance(level: LogEntry['level'], event: string, data: {
    input?: any
    output?: any
    debug?: any
    error?: string
    sessionId?: string
  }) {
    this.writeToFile('enhance.log', {
      timestamp: new Date().toISOString(),
      level,
      component: 'EnhanceAPI',
      event,
      ...data
    })
  }

  // Frontend Logging (browser-compatible)
  logFrontend(level: LogEntry['level'], component: string, event: string, data: {
    input?: any
    output?: any
    debug?: any
    error?: string
    sessionId?: string
  }) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      event,
      ...data
    }

    // Console log for immediate debugging
    console.log(`[${level}] ${component}:${event}`, logEntry)

    // Send to server endpoint for file logging (non-blocking)
    if (typeof window !== 'undefined') {
      fetch('/api/log-frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(error => {
        console.warn('[Logger] Failed to send frontend log:', error)
      })
    }
  }

  // Modal-specific logging
  logModal(level: LogEntry['level'], event: string, data: {
    input?: any
    output?: any
    debug?: any
    error?: string
    sessionId?: string
  }) {
    this.writeToFile('modal.log', {
      timestamp: new Date().toISOString(),
      level,
      component: 'ContextQuestionsModal',
      event,
      ...data
    })
  }

  // Generic logging method
  log(filename: string, entry: Omit<LogEntry, 'timestamp'>) {
    this.writeToFile(filename, {
      ...entry,
      timestamp: new Date().toISOString()
    })
  }
}

// Singleton instance
export const logger = new Logger()

// Browser-compatible logging functions
export const logDebug = (component: string, event: string, data?: any) => {
  logger.logFrontend('DEBUG', component, event, { debug: data })
}

export const logInfo = (component: string, event: string, data?: any) => {
  logger.logFrontend('INFO', component, event, { debug: data })
}

export const logError = (component: string, event: string, error: any) => {
  logger.logFrontend('ERROR', component, event, { 
    error: error instanceof Error ? error.message : String(error),
    debug: error
  })
}

export const logWarn = (component: string, event: string, data?: any) => {
  logger.logFrontend('WARN', component, event, { debug: data })
}