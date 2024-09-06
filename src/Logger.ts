/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

export {
  Logger,
}

// Logger.silly(), Logger.trace(), Logger.debug(), Logger.info(), Logger.warn(), Logger.error(), Logger.fatal()

class Logger {
  public static logLevel = process.env['RUNNER_DEBUG'] === '1' ? 'silly' : 'fatal'

  public static log(level: string, message: unknown) {
    if ( ! Logger.shouldLog(level) ) return
  
    const color = Logger.getColor(level)
    const emoji = Logger.getEmoji(level)
    const levelStr = `[${level.toUpperCase()}]`
    const isString = typeof message === 'string'
  
    const logFunction = ['error', 'fatal'].contains(level) ? console.error : console.log
    logFunction(`${color}${emoji} ${levelStr} %s${Logger.getColor('')}`, isString ? message : '', isString ? '' : message)
  }

  public static silly(message: unknown) {
    Logger.log('silly', message)
  }

  public static trace(message: unknown) {
    Logger.log('trace', message)
  }

  public static debug(message: unknown) {
    Logger.log('debug', message)
  }

  public static info(message: unknown) {
    Logger.log('info', message)
  }

  public static warn(message: unknown) {
    Logger.log('warn', message)
  }

  public static error(message: unknown) {
    Logger.log('error', message)
  }

  public static fatal(message: unknown) {
    Logger.log('fatal', message)
  }

  public static shouldLog(level: string): boolean {
    const levels = ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
    return levels.indexOf(level) >= levels.indexOf(Logger.logLevel)
  }

  public static getColor(level: string): string {
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

  public static getEmoji(level: string): string {
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
