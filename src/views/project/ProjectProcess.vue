<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <!-- 返回按钮 -->
      <el-button :icon="ArrowLeft" size="small" @click="goBack" style="margin-bottom: 15px;">
        返回
      </el-button>

      <!-- 项目基本信息 -->
      <el-card v-loading="loading" class="card-shadow" style="margin-bottom: 15px;">
        <template #header>
          <span style="font-size: 16px; font-weight: bold;">项目基本信息</span>
        </template>

        <el-descriptions :column="2" border size="small" v-if="projectData">
          <el-descriptions-item label="项目编号">{{ projectData.projectNo }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ projectData.projectName }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ projectData.projectType }}</el-descriptions-item>
          <el-descriptions-item label="当前阶段">{{ projectData.currentStage }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ projectData.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ projectData.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(projectData.status)">
              {{ getStatusText(projectData.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总经费">¥{{ formatMoney(projectData.totalFund) }}</el-descriptions-item>
          <el-descriptions-item label="项目描述" :span="2">
            {{ projectData.description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(projectData.createTime) }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="加载中..." />
      </el-card>

      <!-- 流程进度展示 -->
      <el-card v-loading="loading" class="card-shadow">
        <template #header>
          <span style="font-size: 16px; font-weight: bold;">流程进度</span>
        </template>

        <div class="process-stages-container">
          <el-tag 
            v-for="process in processStages" 
            :key="process.orderNum"
            :class="['process-stage', { 'submitted': process.status === '已提交', 'unsubmitted': process.status !== '已提交' }]"
            :type="getProcessStatusType(process.status)"
            size="large"
            @click="openProcessDetail(process)"
          >
            <span class="stage-name">{{ process.stage }}</span>
            <div class="stage-actions" v-if="process.status !== '已提交'">
              <el-button size="small" type="primary" @click.stop="submitStage(process)">提交</el-button>
            </div>
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 流程阶段详情对话框 -->
    <el-dialog
      v-model="processDetailDialogVisible"
      :title="`流程阶段详情 - ${selectedProcess?.stage}`"
      width="50%"
    >
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="阶段名称">{{ selectedProcess?.stage }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getProcessStatusType(selectedProcess?.status)">
            {{ selectedProcess?.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审批意见">{{ selectedProcess?.approvalOpinion || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ selectedProcess?.approverName || '暂未指定' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDate(selectedProcess?.submitTime) }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDate(selectedProcess?.operationTime) }}</el-descriptions-item>
        <el-descriptions-item label="附件">
          <div v-if="selectedProcess?.filePaths && selectedProcess.filePaths.length > 0">
            <el-button 
              v-for="(file, index) in selectedProcess.filePaths" 
              :key="index"
              size="small" 
              type="primary" 
              link
              @click="previewFile(file)"
              style="margin-right: 10px;"
            >
              查看
            </el-button>
            <el-button 
              v-for="(file, index) in selectedProcess.filePaths" 
              :key="index + '_download'"
              size="small" 
              type="primary" 
              link
              @click="downloadFile(file)"
              style="margin-right: 10px;"
            >
              下载
            </el-button>
          </div>
          <span v-else>无附件</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="processDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectById } from '@/api/project'
import { ArrowLeft } from '@element-plus/icons-vue'
import { openFileByBlob, downloadFileByBlob } from '@/utils/downLoadpicture'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const projectData = ref(null)
const processStages = ref([])
const processDetailDialogVisible = ref(false)
const selectedProcess = ref(null)

// 获取路由参数中的项目ID
const projectId = ref(route.params.id)

const getStatusType = (status) => {
  const types = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success',
    '进行中': 'primary',
    '申报中': 'warning',
    '筹备中': 'info',
    '结题': 'success',
    '已完成': 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  return status
}

const getProcessStatusType = (status) => {
  if (status === '已提交') return 'success'
  return 'info'
}

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ')
}

const loadProject = async () => {
  loading.value = true
  try {
    const res = await getProjectById(projectId.value)
    
    if (res.data) {
      projectData.value = res.data.project || {}
      // 过滤掉不需要的字段，只保留ProjectProcess
      processStages.value = (res.data.ProjectProcess || []).map(stage => ({
        ...stage,
        filePaths: stage.filePaths ? (Array.isArray(stage.filePaths) ? stage.filePaths : [stage.filePaths]) : []
      }))
    }
  } catch (error) {
    console.error('加载项目详情失败:', error)
    ElMessage.error('加载项目详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/project')
}

const openProcessDetail = (process) => {
  selectedProcess.value = process
  processDetailDialogVisible.value = true
}

const submitStage = async (process) => {
  try {
    await ElMessageBox.confirm(`确定要提交"${process.stage}"阶段吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 这里需要调用提交接口，由于接口未提供，暂时用模拟方式
    ElMessage.success('提交成功')
    // 更新本地数据
    const stage = processStages.value.find(s => s.orderNum === process.orderNum)
    if (stage) {
      stage.status = '已提交'
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  }
}

const previewFile = async (filePath) => {
  try {
    await openFileByBlob(filePath)
  } catch (error) {
    console.error('棰勮澶辫触:', error)
    ElMessage.error('棰勮澶辫触')
  }
}

const downloadFile = async (filePath) => {
  try {
    await downloadFileByBlob(filePath)
  } catch (error) {
    console.error('涓嬭浇澶辫触:', error)
    ElMessage.error('涓嬭浇澶辫触')
  }
}

onMounted(() => {
  loadProject()
})
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.content {
  overflow-y: auto;
  background-color: #f5f7fa;
}

.card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  margin-bottom: 15px;
}

:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
  font-size: 13px;
}

:deep(.el-descriptions__content) {
  font-size: 13px;
}

/* 流程阶段容器 */
.process-stages-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  padding: 15px 0;
}

/* 流程阶段样式 */
.process-stage {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px 20px;
  min-width: 120px;
  text-align: center;
  transition: all 0.3s;
  user-select: none;
}

.process-stage:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.process-stage.unsubmitted {
  background-color: #f5f5f5;
  color: #666;
  border-color: #ddd;
}

.process-stage.submitted {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #c2e7b0;
}

.stage-name {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}

.stage-actions {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-stages-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .process-stage {
    margin-bottom: 10px;
  }
}
</style>
