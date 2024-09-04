/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

class Logger {
    static logLevel = process.env['RUNNER_DEBUG'] === '1' ? 'silly' : 'fatal'
  
    static log(level: string, message: unknown) {
        if (Logger.shouldLog(level)) {
            const isString = typeof message === 'string'
            console.log(`${Logger.getColor(level)}%s${Logger.getColor('')}`, `${Logger.getEmoji(level)} [${level.toUpperCase()}] ${isString?message:''}`, isString?'':message)
        }
    }
  
    static silly(message: unknown) {
      Logger.log('silly', message)
    }
  
    static trace(message: unknown) {
      Logger.log('trace', message)
    }
  
    static debug(message: unknown) {
      Logger.log('debug', message)
    }
  
    static info(message: unknown) {
      Logger.log('info', message)
    }
  
    static warn(message: unknown) {
      Logger.log('warn', message)
    }
  
    static error(message: unknown) {
      Logger.log('error', message)
    }
  
    static fatal(message: unknown) {
      Logger.log('fatal', message)
    }
  
    static shouldLog(level: string): boolean {
      const levels = ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
      return levels.indexOf(level) >= levels.indexOf(Logger.logLevel)
    }
  
    static getColor(level: string): string {
      switch (level) {
        case 'silly': return '\x1b[35m' // Magenta
        case 'trace': return '\x1b[34m' // Blue
        case 'debug': return '\x1b[36m' // Cyan
        case 'info': return '\x1b[32m' // Green
        case 'warn': return '\x1b[33m' // Yellow
        case 'error': return '\x1b[31m' // Red
        case 'fatal': return '\x1b[41m' // Red background
        default: return '\x1b[0m' // Reset
      }
    }
  
    static getEmoji(level: string): string {
      switch (level) {
        case 'silly': return '🤪'
        case 'trace': return '🔍'
        case 'debug': return '🐛'
        case 'info': return 'ℹ️ '
        case 'warn': return '⚠️ '
        case 'error': return '❌'
        case 'fatal': return '💀'
        default: return ''
      }
    }
  }

  export { Logger }
