import { generateUUID } from './UUID.js'

export const ensureOperationId = body => {
  const payload = body && typeof body === 'object' ? body : {}
  if (!payload.operationId) payload.operationId = generateUUID()
  return payload
}

export const createSingleFlight = () => {
  const requests = new Map()
  return (key, start) => {
    const requestKey = String(key)
    if (requests.has(requestKey)) return requests.get(requestKey)
    const request = Promise.resolve().then(start)
    requests.set(requestKey, request)
    request.finally(() => requests.delete(requestKey)).catch(() => {})
    return request
  }
}
