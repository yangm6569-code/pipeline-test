import request from './request'

export function getTodoOverview() {
  return request({
    // Prefer the base path for compatibility with older gateways.
    url: '/todo',
    method: 'get'
  })
}
