const TOKEN_KEY = 'admin_token'
const USER_INFO_KEY = 'admin_user_info'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn() {
    return !!getToken()
}

export function getUserInfo() {
    const value = localStorage.getItem(USER_INFO_KEY)
    if (!value) return null

    try {
        return JSON.parse(value)
    } catch (error) {
        localStorage.removeItem(USER_INFO_KEY)
        return null
    }
}

export function setUserInfo(userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo || null))
}

export function removeUserInfo() {
    localStorage.removeItem(USER_INFO_KEY)
}
