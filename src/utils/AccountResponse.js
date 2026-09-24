/** Parse the real server's direct and `{ res }` account endpoint responses. */
export const parseAccountResponse = async response => {
  const result = await response
  const body = await result.json().catch(() => ({}))
  if (!result.ok) {
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : `Request failed (${result.status})`,
    )
  }
  return body?.res ?? body
}

export const inviteCodeFromResponse = response =>
  response?.inviteCode ?? response?.invite_code ?? null
