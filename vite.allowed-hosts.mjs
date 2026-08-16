const exactHostnamePattern =
  /^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)(?:\.(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?))*$/i

export const resolveAllowedHostsEnv = (env = process.env) =>
  env.DAYDAN_ALLOWED_HOSTS || env.TASKIER_ALLOWED_HOSTS || ''

export const parseAllowedHosts = (value = '') =>
  value
    .split(',')
    .map(host => host.trim())
    .filter(Boolean)
    .map(host => {
      if (!exactHostnamePattern.test(host)) {
        throw new Error(
          `Invalid DAYDAN_ALLOWED_HOSTS entry: ${JSON.stringify(host)}. Use exact hostnames separated by commas.`,
        )
      }

      return host.toLowerCase()
    })
