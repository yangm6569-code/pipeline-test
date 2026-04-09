const APPROVAL_ROLE_KEYS = ['treeAuditor', 'threeAuditor', 'oneAuditor', 'twoAuditor']

export const MODULE_ROLE_MAP = {
  dashboard: ['admin', 'teach'],
  approval: ['admin', ...APPROVAL_ROLE_KEYS],
  user: ['admin'],
  role: ['admin'],
  project: ['admin', 'teach'],
  achievement: ['admin', 'teach'],
  reimbursement: ['admin', 'fAdmin']
}

export function normalizeRoleKey(roleKey) {
  const value = String(roleKey || '').trim()
  // 兼容后端可能返回 threeAuditor / treeAuditor 的差异
  if (value === 'threeAuditor') return 'treeAuditor'
  return value
}

export function canAccessModule(roleKey, moduleKey) {
  const normalizedRole = normalizeRoleKey(roleKey)
  const allowedRoles = MODULE_ROLE_MAP[moduleKey]

  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  return allowedRoles.map(normalizeRoleKey).includes(normalizedRole)
}

export function getDefaultRouteByRole(roleKey) {
  if (canAccessModule(roleKey, 'dashboard')) {
    return '/dashboard'
  }
  if (canAccessModule(roleKey, 'approval')) {
    return '/project/process-approval'
  }
  if (canAccessModule(roleKey, 'reimbursement')) {
    return '/reimbursement'
  }
  if (canAccessModule(roleKey, 'project')) {
    return '/project/list'
  }
  if (canAccessModule(roleKey, 'achievement')) {
    return '/achievement'
  }
  return '/login'
}

export function isProjectApplyingStatus(status) {
  const value = String(status || '')
  return value === '申报中' || value.includes('申报')
}
