import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
    baseURL: '/api',
    timeout: 15000
})

request.interceptors.request.use(
    config => {
        const userStore = useUserStore()
        if (userStore.token) {
            config.headers['Authorization'] = `Bearer ${userStore.token}`
        }
        return config
    },
    error => Promise.reject(error)
)

request.interceptors.response.use(
    response => {
        if (response.config?.responseType === 'blob' || response.config?.responseType === 'arraybuffer') {
            return response.data
        }

        const res = response.data
        if (res.code !== 200 && res.code !== 0) {
            if (res.code === 401) {
                const userStore = useUserStore()
                userStore.clearAuth()
                if (router.currentRoute.value.path !== '/login') {
                    router.push('/login')
                }
                ElMessage.error('登录已过期，请重新登录')
                return Promise.reject(new Error('登录已过期，请重新登录'))
            }
            ElMessage.error(res.message || '请求失败')
            return Promise.reject(new Error(res.message || '请求失败'))
        }
        return res
    },
    error => {
        if (error.response?.status === 401) {
            const userStore = useUserStore()
            userStore.clearAuth()
            if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
            }
            ElMessage.error('登录已过期，请重新登录')
            return Promise.reject(new Error('登录已过期，请重新登录'))
        }

        ElMessage.error(error.message || '网络错误')
        return Promise.reject(error)
    }
)

export default request
