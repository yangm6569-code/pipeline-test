import { defineStore } from 'pinia'
import { login, logout, getCurrentUserInfo } from '@/api/user'
import { setToken, getToken, removeToken, setUserInfo, getUserInfo, removeUserInfo } from '@/utils/auth'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: getToken(),
        userInfo: getUserInfo()
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        username: (state) => state.userInfo?.username || '',
        realName: (state) => state.userInfo?.realName || '',
        roleKey: (state) => state.userInfo?.roleKey || ''
    },

    actions: {
        async login(loginForm) {
            const res = await login(loginForm)
            
            const loginData = res.data || {}
            const token = loginData.token || res.token || ''
            
            if (!token) {
                throw new Error('未获取到 Token')
            }
            
            this.token = token
            setToken(token)

            if (loginData.userInfo) {
                this.userInfo = loginData.userInfo
                setUserInfo(loginData.userInfo)
            } else {
                await this.getUserInfo()
            }

            return res
        },

        async ensureUserInfo() {
            if (this.userInfo?.userId) {
                return this.userInfo
            }

            if (!this.token) {
                return null
            }

            const localUserInfo = getUserInfo()
            if (localUserInfo?.userId) {
                this.userInfo = localUserInfo
                return localUserInfo
            }

            try {
                return await this.getUserInfo()
            } catch (error) {
                this.clearAuth()
                throw error
            }
        },

        async getUserInfo() {
            const res = await getCurrentUserInfo()
            this.userInfo = res.data || res || null
            setUserInfo(this.userInfo)
            return this.userInfo
        },

        clearAuth() {
            this.token = null
            this.userInfo = null
            removeToken()
            removeUserInfo()
        },

        async logout() {
            try {
                await logout()
            } catch (error) {
                console.warn('退出登录接口调用失败，已执行本地登出', error)
            } finally {
                this.clearAuth()
            }
        }
    }
})
