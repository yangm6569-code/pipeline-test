import request from './request'

export function login(data) {
    return request({
        url: '/user/login',
        method: 'post',
        data
    })
}

export function logout() {
    return request({
        url: '/user/logout',
        method: 'post'
    })
}

export function getCurrentUserInfo() {
    return request({
        url: '/user/current',
        method: 'get'
    })
}

export function getUserList(params) {
    return request({
        url: '/user/list',
        method: 'get',
        params
    })
}

export function createUser(data) {
    return request({
        url: '/user',
        method: 'post',
        data
    })
}

export function updateUser(userId, data) {
    return request({
        url: `/user/${userId}`,
        method: 'put',
        data
    })
}

export function deleteUser(userId) {
    return request({
        url: `/user/${userId}`,
        method: 'delete'
    })
}

export function getDepartmentList(level) {
    return request({
        url: `/department/level/${level}`,
        method: 'get'
    })
}

export function getDepartmentTree() {
    return request({
        url: '/department/tree',
        method: 'get'
    })
}

export function getAllDepartments() {
    return request({
        url: '/department/list',
        method: 'get'
    })
}

export function createDepartment(data) {
    return request({
        url: '/department',
        method: 'post',
        data
    })
}

export function updateDepartment(deptId, data) {
    return request({
        url: `/department/${deptId}`,
        method: 'put',
        data
    })
}

export function deleteDepartment(deptId) {
    return request({
        url: `/department/${deptId}`,
        method: 'delete'
    })
}
