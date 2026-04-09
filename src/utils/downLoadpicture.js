import request from '@/api/request'
import { getToken } from '@/utils/auth'

function withToken(url) {
  const token = getToken()
  if (!token) return url
  const joiner = url.includes('?') ? '&' : '?'
  return `${url}${joiner}token=${encodeURIComponent(token)}`
}

// Compatibility API: URL mode (for places that still expect string url)
export function getFileViewUrl(absolutePath) {
  if (!absolutePath) return ''
  return withToken(`/api/file/view?absolutePath=${encodeURIComponent(absolutePath)}`)
}

export function getFileDownloadUrl(absolutePath) {
  if (!absolutePath) return ''
  return withToken(`/api/file/download?absolutePath=${encodeURIComponent(absolutePath)}`)
}

// Recommended API: blob mode (always carries Authorization header via axios interceptor)
export async function getFileViewBlobUrl(absolutePath) {
  if (!absolutePath) return ''
  const blob = await request({
    url: '/file/view',
    method: 'get',
    params: { absolutePath },
    responseType: 'blob'
  })
  return window.URL.createObjectURL(blob)
}

export async function openFileByBlob(absolutePath) {
  const blobUrl = await getFileViewBlobUrl(absolutePath)
  if (!blobUrl) return
  window.open(blobUrl, '_blank')
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000)
}

export async function downloadFileByBlob(absolutePath, fileName) {
  if (!absolutePath) return
  const blob = await request({
    url: '/file/download',
    method: 'get',
    params: { absolutePath },
    responseType: 'blob'
  })

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName || getFileNameFromPath(absolutePath)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

export function revokeBlobUrl(url) {
  if (url) {
    window.URL.revokeObjectURL(url)
  }
}

export function getFileNameFromPath(filePath) {
  if (!filePath) return 'file'
  const normalized = String(filePath).replace(/\\/g, '/')
  const name = normalized.split('/').pop()
  return name || 'file'
}

// backward compatibility
export const getFileUrl = getFileViewUrl
