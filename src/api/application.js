import request from './request'

export function createApplication(data) {
    return request({
        url: '/application',
        method: 'post',
        data
    })
}

export function approveApplication(applyId, opinion) {
  return request({
    url: `/application/${applyId}/approve`,
    method: 'post',
    data: { opinion }
  })
}

export function rejectApplication(applyId, opinion) {
  return request({
    url: `/application/${applyId}/reject`,
    method: 'post',
    data: { opinion }
  })
}

export function getApplicationDetail(applyId) {
  return request({
    url: `/application/${applyId}/detail`,
    method: 'get'
  })
}

export function searchApplications(params) {
    return request({
        url: '/application/search',
        method: 'get',
        params
    })
}

export function getNeedApprovalApplications(params) {
    return request({
        url: '/application/need-approval',
        method: 'get',
        params
    })
}
