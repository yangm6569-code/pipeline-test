import request from './request'

export function createAchievement(data) {
    return request({
        url: '/achievement',
        method: 'post',
        data
    })
}

export function getAllAchievements() {
    return request({
        url: '/achievement/list',
        method: 'get'
    })
}
