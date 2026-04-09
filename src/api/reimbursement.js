import request from './request'

export function createReimbursement(data) {
    return request({
        url: '/reimbursement',
        method: 'post',
        data
    })
}

export function getReimbursementsByProject(projectId) {
    return request({
        url: `/reimbursement/project/${projectId}`,
        method: 'get'
    })
}

export function getReimbursementPage(params) {
    return request({
        url: '/reimbursement/page',
        method: 'get',
        params
    })
}
