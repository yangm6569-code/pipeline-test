<template>
  <div class="sidebar">
    <el-menu
      :default-active="activeMenu"
      class="menu"
      background-color="#ffffff"
      text-color="#303133"
      active-text-color="#9357F1"
      router
    >
      <el-menu-item v-if="showDashboard" index="/dashboard">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>

      <el-menu-item index="/ai/chat">
        <el-icon><ChatDotRound /></el-icon>
        <span>AI聊天</span>
      </el-menu-item>

      <el-sub-menu v-if="showApproval" index="/approval">
        <template #title>
          <el-icon><DocumentChecked /></el-icon>
          <span>审批</span>
        </template>
        <el-menu-item index="/project/process-approval">
          <el-icon><DataLine /></el-icon>
          <span>项目流程审批</span>
        </el-menu-item>
        <el-menu-item index="/application/approval">
          <el-icon><Edit /></el-icon>
          <span>申请审批</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-if="showUser" index="/user">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>

      <el-menu-item v-if="showProject" index="/project/list">
        <el-icon><Folder /></el-icon>
        <span>项目管理</span>
      </el-menu-item>

      <el-menu-item v-if="showAchievement" index="/achievement">
        <el-icon><Trophy /></el-icon>
        <span>成果管理</span>
      </el-menu-item>

      <el-menu-item v-if="showReimbursement" index="/reimbursement">
        <el-icon><Wallet /></el-icon>
        <span>报销管理</span>
      </el-menu-item>

      <el-menu-item v-if="showRole" index="/role">
        <el-icon><Setting /></el-icon>
        <span>角色管理</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled,
  DocumentChecked,
  Edit,
  User,
  Folder,
  Trophy,
  Wallet,
  Setting,
  DataLine,
  ChatDotRound
} from '@element-plus/icons-vue'
import { canAccessModule } from '@/utils/permission'

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const roleKey = computed(() => userStore.roleKey)

const showDashboard = computed(() => canAccessModule(roleKey.value, 'dashboard'))
const showApproval = computed(() => canAccessModule(roleKey.value, 'approval'))
const showUser = computed(() => canAccessModule(roleKey.value, 'user'))
const showProject = computed(() => canAccessModule(roleKey.value, 'project'))
const showAchievement = computed(() => canAccessModule(roleKey.value, 'achievement'))
const showReimbursement = computed(() => canAccessModule(roleKey.value, 'reimbursement'))
const showRole = computed(() => canAccessModule(roleKey.value, 'role'))
</script>

<style scoped>
.sidebar {
  width: 200px;
  height: calc(100vh - 60px);
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
}

.el-menu {
  border-right: none;
}
</style>
