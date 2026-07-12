import { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now()
  const { method, url } = req

  _res.on('finish', () => {
    const duration = Date.now() - start
    const { statusCode } = _res
    const logMsg = `${method} ${url} ${statusCode} ${duration}ms`
    if (statusCode >= 400) {
      console.error(`[${new Date().toISOString()}] ${logMsg}`)
    } else {
      console.log(`[${new Date().toISOString()}] ${logMsg}`)
    }
  })

  next()
}
