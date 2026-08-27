export const isAllowedServerURL = (value, native) => {
  try {
    const url = new URL(value.trim())
    const allowedProtocols = native ? ['https:'] : ['http:', 'https:']
    return Boolean(url.hostname) && allowedProtocols.includes(url.protocol)
  } catch {
    return false
  }
}
