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
      <el-card v-loading="loading" class="card-shadow" style="margin-bottom: 15px;">
        <template #header>
          <span style="font-size: 16px; font-weight: bold;">流程进度</span>
        </template>

        <div class="process-stages-container">
          <el-tag 
            v-for="process in processStages" 
            :key="process.orderNum"
            :class="['process-stage', { 'active': activeStage === process.orderNum }]"
            :type="getProcessStatusType(process.status)"
            size="large"
            @click="selectStage(process.orderNum)"
          >
            {{ process.stage }}
          </el-tag>
        </div>
      </el-card>

      <!-- 当前选中阶段的详情 -->
      <el-card v-loading="loading" class="card-shadow">
        <template #header>
          <span style="font-size: 16px; font-weight: bold;">阶段详情 - {{ currentStage?.stage }}</span>
        </template>

        <el-descriptions :column="1" border size="small" v-if="currentStage">
          <el-descriptions-item label="阶段名称">{{ currentStage.stage }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getProcessStatusType(currentStage.status)">
              {{ currentStage.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批意见">
            {{ currentStage.approvalOpinion || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审批人">
            {{ currentStage.approverName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(currentStage.submitTime) }}</el-descriptions-item>

          <!-- 只有当存在操作时间时才显示该行 -->
          <el-descriptions-item
            label="操作时间"
            v-if="currentStage.operationTime"
          >
            {{ formatDate(currentStage.operationTime) }}
          </el-descriptions-item>

          <el-descriptions-item label="已上传附件">
            <div v-if="currentStage.filePaths && currentStage.filePaths.length > 0">
              <div
                v-for="(file, index) in currentStage.filePaths"
                :key="index"
                class="attachment-file"
              >
                <el-link
                  type="primary"
                  :underline="false"
                  @click="previewFile(file)"
                  class="file-link"
                >
                  {{ getFileNameFromPath(file) }}
                </el-link>
                <div class="file-actions">
                  <el-button
                    size="small"
                    type="primary"
                    link
                    @click="previewFile(file)"
                    style="margin-right: 10px;"
                  >
                    查看
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    link
                    @click="downloadFile(file)"
                    style="margin-right: 10px;"
                  >
                    下载
                  </el-button>
                </div>
              </div>
            </div>
            <span v-else>无附件</span>
          </el-descriptions-item>
          <el-descriptions-item label="上传附件">
            <div v-if="isNotSubmitted(currentStage) || currentStage.status === '已拒绝'" class="submit-section">
              <div class="upload-container">
                <el-upload
                  ref="uploadRef"
                  action="#"
                  :http-request="handleUpload"
                  :on-remove="handleRemoveFile"
                  :limit="10"
                  :multiple="true"
                  :file-list="[]"
                  :before-upload="beforeUpload"
                  :show-file-list="false"
                  class="upload-component"
                >
                  <el-button slot="trigger" size="small" type="primary" plain>
                    选择文件
                  </el-button>
                </el-upload>

                <!-- 显示已选择的文件 -->
                <div v-if="currentFiles.length > 0" class="selected-files">
                  <div
                    v-for="(file, index) in currentFiles"
                    :key="index"
                    class="file-item"
                  >
                    <span class="file-name">{{ file.name }}</span>
                    <el-button
                      size="small"
                      type="danger"
                      circle
                      icon="Delete"
                      @click="removeFile(index)"
                      class="remove-btn"
                    />
                  </div>
                </div>
              </div>

              <el-button
                type="primary"
                @click="submitStage(currentStage)"
                class="submit-button"
                :disabled="uploading"
                :loading="uploading"
              >
                提交
              </el-button>
            </div>
            <div v-else>
              <el-tag :type="getProcessStatusType(currentStage.status)">
                {{ currentStage.status }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无数据" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectById } from '@/api/project'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import request from '@/api/request'
import { openFileByBlob, downloadFileByBlob } from '@/utils/downLoadpicture'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const projectData = ref(null)
const processStages = ref([])
const activeStage = ref(1) // 默认激活第一个阶段

// 使用对象存储每个阶段的文件列表
const fileLists = ref({})
const uploading = ref(false)

// 获取路由参数中的项目ID
const projectId = ref(route.params.id)

// 计算当前阶段的文件列表
const currentFiles = computed(() => {
  return currentStage.value ? (fileLists.value[currentStage.value.orderNum] || []) : []
})

const getStatusType = (status) => {
  const types = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success',
    '进行中': 'primary',
    '申报中': 'warning',
    '筹备中': 'info',
    '结题': 'success',
    '已完成': '成功'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  return status
}

const getProcessStatusType = (status) => {
  if (status === '已提交') return 'success'
  if (status === '审批中') return 'warning'
  if (status === '已拒绝') return 'danger'
  if (status === '已通过') return 'success'
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

const getFileNameFromPath = (filePath) => {
  if (!filePath) return ''
  return filePath.split('\\').pop().split('/').pop() || '未知文件'
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

      // 初始化每个阶段的文件列表
      processStages.value.forEach(stage => {
        if (!fileLists.value[stage.orderNum]) {
          fileLists.value[stage.orderNum] = []
        }
      })

      // 默认激活第一个阶段
      if (processStages.value.length > 0 && !activeStage.value) {
        activeStage.value = processStages.value[0].orderNum
      }
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

const selectStage = (orderNum) => {
  activeStage.value = orderNum
}

const currentStage = computed(() => {
  return processStages.value.find(s => s.orderNum === activeStage.value) || null
})

const beforeUpload = (file) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('文件大小不能超过 2MB!')
  }
  return isLt2M
}

const handleRemoveFile = (file, uploadFiles) => {
  // 更新当前阶段的文件列表
  if (currentStage.value) {
    fileLists.value[currentStage.value.orderNum] = uploadFiles
  }
}

const removeFile = (index) => {
  if (currentStage.value) {
    fileLists.value[currentStage.value.orderNum].splice(index, 1)
  }
}

const handleUpload = async (options) => {
  try {
    uploading.value = true

    const file = options.file
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'document')

    const res = await request({
      url: '/file/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.code === 200 && res.data) {
      // 添加到当前阶段的文件列表
      if (currentStage.value) {
        const currentOrderNum = currentStage.value.orderNum
        if (!fileLists.value[currentOrderNum]) {
          fileLists.value[currentOrderNum] = []
        }
        fileLists.value[currentOrderNum].push({
          name: file.name,
          path: res.data,
          raw: file
        })
      }
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
      options.onError()
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
    options.onError()
  } finally {
    uploading.value = false
  }
}

const submitStage = async (process) => {
  try {
    // 检查是否有文件被上传
    const currentFiles = fileLists.value[process.orderNum] || []
    if (currentFiles.length === 0) {
      ElMessage.warning('请至少上传一个文件')
      return
    }

    // 确认提交
    await ElMessageBox.confirm(`确定要提交"${process.stage}"阶段吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 准备请求数据
    const filePaths = currentFiles.map(f => f.path).join(',')
    const requestData = {
      processId: process.processId,
      filePaths: filePaths
    }

    // 调用提交接口
    const submitRes = await request({
      url: '/process/submit',
      method: 'put',
      data: requestData,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (submitRes.code === 200) {
      ElMessage.success('提交成功')
      // 提交成功后重新加载项目数据，确保状态与后端一致
      await loadProject()
    } else {
      throw new Error(submitRes.message || '提交失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '提交失败')
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

const isNotSubmitted = (stage) => {
  return stage?.status === '未提交' || stage?.status === '已拒绝'
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
  cursor: pointer;
  border-radius: 12px;
  padding: 8px 16px;
  min-width: 100px;
  text-align: center;
  transition: all 0.3s;
  user-select: none;
}

.process-stage:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.process-stage.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.process-stage[type="info"] {
  background-color: #f5f5f5;
  color: #666;
  border-color: #ddd;
}

.process-stage[type="success"] {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #c2e7b0;
}

.process-stage[type="warning"] {
  background-color: #fdf6ec;
  color: #e6a23a;
  border-color: #f5dab1;
}

.process-stage[type="danger"] {
  background-color: #fef0f0;
  color: #f56c6c;
  border-color: #fbc4c4;
}

/* 上传区域样式 */
.upload-container {
  display: inline-block;
  vertical-align: top;
  min-width: 200px;
}

.upload-component ::v-deep .el-upload {
  margin-bottom: 8px;
}

/* 已选择文件列表 */
.selected-files {
  max-height: 100px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px;
  background-color: #f5f5f5;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.remove-btn {
  padding: 4px;
  line-height: 1;
}

/* 已上传附件样式 */
.attachment-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.attachment-file:last-child {
  border-bottom: none;
}

.file-link {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  align-items: center;
}

/* 隐藏非未提交状态下的上传组件 */
.submit-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.submit-button {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-stages-container {
    justify-content: center;
  }

  .process-stage {
    margin-bottom: 8px;
  }

  .submit-section {
    flex-direction: column;
  }

  .submit-button {
    margin-top: 0;
    align-self: flex-start;
  }
}
</style>
