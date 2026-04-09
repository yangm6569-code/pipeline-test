import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import router from '@/router'

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
}

function getFileNameFromHeader(contentDisposition, fallbackName) {
  if (!contentDisposition) return fallbackName

  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (normalMatch?.[1]) {
    return decodeURIComponent(normalMatch[1])
  }

  return fallbackName
}

export async function exportExcel(url, params = {}, fallbackName = '导出数据.xlsx') {
  const query = buildQuery(params)
  const requestUrl = query ? `${url}?${query}` : url
  const token = getToken()

  const response = await fetch(`/api${requestUrl}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  if (response.status === 401) {
    const userStore = useUserStore()
    userStore.clearAuth()
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    throw new Error(`导出失败(${response.status})`)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition')
  const fileName = getFileNameFromHeader(contentDisposition, fallbackName)

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
