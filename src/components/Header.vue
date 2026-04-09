<template>
  <div class="header gradient-bg">
    <div class="header-left">
      <el-icon size="24" color="#fff"><Monitor /></el-icon>
      <span class="title">高校科研管理系统</span>
    </div>
    <div class="header-right">
      <span class="username">欢迎，{{ displayName }}</span>
      <el-button text style="color: #fff;" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

const displayName = computed(() => {
  return userStore.username || userStore.realName || '用户'
})

const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(155, 89, 182, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.username {
  color: #fff;
  font-size: 14px;
}
</style>
