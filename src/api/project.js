import request from './request'

export function getProjectList(params) {
    return request({
        url: '/project/list',
        method: 'get',
        params
    })
}

export function getProjectOverview() {
    return request({
        url: '/project/overview',
        method: 'get'
    })
}

export function getProjectById(projectId) {
    return request({
        url: `/project/${projectId}`,
        method: 'get'
    })
}

export function createProject(data) {
    return request({
        url: '/project',
        method: 'post',
        data
    })
}

export function updateProject(projectId, data) {
    return request({
        url: `/project/${projectId}`,
        method: 'put',
        data
    })
}

export function deleteProject(projectId) {
    return request({
        url: `/project/${projectId}`,
        method: 'delete'
    })
}
