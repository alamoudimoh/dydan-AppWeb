import { beforeEach, expect, it, vi } from 'vitest'

const init = vi.fn(async () => {})
const getApiURL = vi.fn(() => 'https://self-hosted.example/api/v1')

vi.mock('./ApiClient', () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    getApiURL,
    getHeaders: vi.fn(() => ({})),
    init,
    post: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
  },
}))

vi.mock('./TokenStorage', () => ({ getRefreshToken: vi.fn() }))

beforeEach(() => {
  init.mockClear()
  getApiURL.mockClear()
  global.fetch = vi.fn(async () => ({ ok: true }))
})

it('initializes the selected server and submits reset credentials in JSON', async () => {
  const { ChangePassword } = await import('./Fetcher.jsx')
  await ChangePassword('reset-secret', 'new-password')

  expect(init).toHaveBeenCalledOnce()
  expect(init.mock.invocationCallOrder[0]).toBeLessThan(
    getApiURL.mock.invocationCallOrder[0],
  )
  const [url, request] = fetch.mock.calls[0]
  expect(url).toBe('https://self-hosted.example/api/v1/auth/password')
  expect(request.method).toBe('POST')
  expect(JSON.parse(request.body)).toEqual({
    code: 'reset-secret',
    password: 'new-password',
  })
})
