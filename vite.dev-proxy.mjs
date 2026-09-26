export const DEFAULT_DEV_PROXY_TARGET = 'http://127.0.0.1:7171'

export const resolveDevProxyTarget = (env = {}) =>
  env.VITE_DEV_PROXY_TARGET || DEFAULT_DEV_PROXY_TARGET
