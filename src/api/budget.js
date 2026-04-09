import request from './request'

export function createBudget(data) {
    return request({
        url: '/budget',
        method: 'post',
        data
    })
}

export function getBudgetsByProject(projectId) {
    return request({
        url: `/budget/project/${projectId}`,
        method: 'get'
    })
}

export function getTotalBudget(projectId) {
    return request({
        url: `/budget/project/${projectId}/total`,
        method: 'get'
    })
}
