<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProjectById } from '@/api/project'
import { ArrowLeft, Plus, Upload, Delete, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { getFileViewUrl } from '@/utils/downLoadpicture'

const route = useRoute()
const router = useRouter()
const projectData = ref(null)
const budgetList = ref([])
const reimbursementList = ref([])
const loading = ref(true)

// 报销对话框
const reimbursementDialogVisible = ref(false)
const reimbursementFormRef = ref(null)
const reimbursementFormData = ref({
  projectId: null,
  reimburseAmount: 0,
  reimburseType: '',
  description: '',
  attachmentPath: ''
})

const reimbursementFormRules = {
  reimburseAmount: [
    { required: true, message: '请输入报销金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '报销金额必须大于 0', trigger: 'blur' }
  ],
  reimburseType: [{ required: true, message: '请选择报销类型', trigger: 'change' }]
}

const uploading = ref(false)
const previewImage = ref('')
const uploadFileList = ref([])

// 报销详情对话框
const detailDialogVisible = ref(false)
const currentReimbursement = ref(null)
const currentAttachmentUrl = ref('')

const totalBudget = computed(() => {
  return budgetList.value.reduce((sum, item) => sum + (item.budgetAmount || 0), 0)
})

const totalUsed = computed(() => {
  return budgetList.value.reduce((sum, item) => sum + (item.usedAmount || 0), 0)
})

const totalRemaining = computed(() => {
  return budgetList.value.reduce((sum, item) => sum + (item.remainingAmount || 0), 0)
})

const getStatusType = (status) => {
  const types = {
    '进行中': 'primary',
    '申报中': 'warning',
    '已完成': 'success',
    '结题': 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  return status
}

const getReimbursementStatusType = (status) => {
  const types = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    '待审批': 'warning',
    '已通过': 'success',
    '已拒绝': 'danger'
  }
  return types[status] || 'info'
}

const getReimbursementStatusText = (status) => {
  const texts = {
    'pending': '待审批',
    'approved': '已通过',
    'rejected': '已拒绝',
    '待审批': '待审批',
    '已通过': '已通过',
    '已拒绝': '已拒绝'
  }
  return texts[status] || status
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
    const projectId = route.params.id
    const res = await getProjectById(projectId)

    if (res.data) {
      projectData.value = res.data.project || {}
      budgetList.value = res.data.budgetList || []
      reimbursementList.value = res.data.reimbursementList || []
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

const handleAddReimbursement = () => {
  reimbursementFormData.value = {
    projectId: projectData.value?.projectId || null,
    reimburseAmount: 0,
    reimburseType: '',
    description: '',
    attachmentPath: ''
  }
  previewImage.value = ''
  uploadFileList.value = []
  reimbursementDialogVisible.value = true
}

const handleFileChange = async (options) => {
  uploading.value = true
  try {
    const file = options.file
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'receipt')

    const res = await request({
      url: '/file/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.code === 200 && res.data) {
      reimbursementFormData.value.attachmentPath = res.data
      previewImage.value = res.data
      options.onSuccess?.(res, file)
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
      reimbursementFormData.value.attachmentPath = ''
      previewImage.value = ''
      options.onError?.(new Error(res.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
    reimbursementFormData.value.attachmentPath = ''
    previewImage.value = ''
    options.onError?.(error)
  } finally {
    uploading.value = false
  }
}

const handleRemoveFile = () => {
  uploadFileList.value = []
  reimbursementFormData.value.attachmentPath = ''
  previewImage.value = ''
}

const submitReimbursement = async () => {
  try {
    await reimbursementFormRef.value.validate()

    const data = {
      ...reimbursementFormData.value,
      projectId: Number(reimbursementFormData.value.projectId),
      reimburseAmount: Number(reimbursementFormData.value.reimburseAmount)
    }

    await request({
      url: '/reimbursement',
      method: 'post',
      data
    })

    ElMessage.success('提交成功')
    reimbursementDialogVisible.value = false
    loadProject()
  } catch (error) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  }
}

const handleViewDetail = (row) => {
  currentReimbursement.value = row
  detailDialogVisible.value = true
}

const getImageUrl = (path) => {
  if (!path) return ''
  return getFileViewUrl(path)
}

onMounted(() => {
  loadProject()
})
</script>

<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <!-- 项目基本信息 -->
      <el-card v-loading="loading" class="card-shadow" style="margin-bottom: 15px;">
        <template #header>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <el-button :icon="ArrowLeft" circle size="small" @click.stop="goBack" style="width: 28px; height: 28px;" />
            <span style="font-size: 16px; font-weight: bold;">基本信息</span>
          </div>
        </template>

        <el-descriptions :column="2" border size="small" v-if="projectData">
          <el-descriptions-item label="项目编号">{{ projectData.projectNo }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ projectData.projectName }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ projectData.projectType }}</el-descriptions-item>
          <el-descriptions-item label="当前阶段">{{ projectData.currentStage }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ projectData.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ projectData.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="getStatusType(projectData.status)">
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

      <!-- 预算明细 -->
      <el-card v-loading="loading" class="card-shadow" style="margin-bottom: 15px;">
        <template #header>
          <div class="card-header">
            <span style="font-size: 14px; font-weight: bold;">预算明细</span>
          </div>
        </template>

        <el-table :data="budgetList" stripe style="width: 100%;" size="small" max-height="300">
          <el-table-column type="index" label="序号" width="50" />
          <el-table-column prop="budgetType" label="预算类型" min-width="100" />
          <el-table-column prop="budgetAmount" label="预算金额 (元)" width="90" />
          <el-table-column prop="usedAmount" label="已使用 (元)" width="90" />
          <el-table-column prop="remainingAmount" label="剩余 (元)" width="90" />
          <el-table-column prop="fiscalYear" label="年度" width="70" />
        </el-table>

        <div v-if="budgetList.length > 0" style="margin-top: 10px; text-align: right; font-size: 13px; font-weight: bold; color: #409EFF;">
          总计：¥{{ formatMoney(totalBudget) }} | 已用：¥{{ formatMoney(totalUsed) }} | 剩余：¥{{ formatMoney(totalRemaining) }}
        </div>
      </el-card>

      <!-- 报销记录 -->
      <el-card v-loading="loading" class="card-shadow">
        <template #header>
          <div class="card-header">
            <span style="font-size: 14px; font-weight: bold;">报销记录</span>
            <el-button type="primary" size="small" @click.stop="handleAddReimbursement">
              <el-icon><Plus /></el-icon>
              申请报销
            </el-button>
          </div>
        </template>

        <el-table v-if="reimbursementList.length > 0" :data="reimbursementList" stripe style="width: 100%;" size="small" max-height="300">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="reimburseType" label="报销类型" min-width="120" />
          <el-table-column prop="reimburseAmount" label="金额 (元)" width="100" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="getReimbursementStatusType(row.status)">
                {{ getReimbursementStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="applyUserName" label="申请人" min-width="100" />
          <el-table-column prop="approvalUserName" label="审批人" min-width="100" />
          <el-table-column prop="createTime" label="申请时间" width="160" />
          <el-table-column prop="approvalTime" label="审批时间" width="160" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleViewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无报销记录" />
      </el-card>
    </div>

    <!-- 申请报销对话框 -->
    <el-dialog
      v-model="reimbursementDialogVisible"
      title="申请报销"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="reimbursementFormRef" :model="reimbursementFormData" :rules="reimbursementFormRules" label-width="100px">
        <el-form-item label="报销金额" prop="reimburseAmount">
          <el-input-number
            v-model="reimbursementFormData.reimburseAmount"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 100%;"
            placeholder="请输入报销金额"
          />
        </el-form-item>
        <el-form-item label="报销类型" prop="reimburseType">
          <el-select v-model="reimbursementFormData.reimburseType" placeholder="请选择报销类型" style="width: 100%;">
            <el-option label="设备费" value="设备费" />
            <el-option label="材料费" value="材料费" />
            <el-option label="测试化验加工费" value="测试化验加工费" />
            <el-option label="燃料动力费" value="燃料动力费" />
            <el-option label="差旅费" value="差旅费" />
            <el-option label="会议费" value="会议费" />
            <el-option label="出版/文献/信息传播/知识产权事务费" value="出版/文献/信息传播/知识产权事务费" />
            <el-option label="人员费" value="人员费" />
            <el-option label="专家咨询费" value="专家咨询费" />
            <el-option label="劳务费" value="劳务费" />
            <el-option label="其他支出" value="其他支出" />
          </el-select>
        </el-form-item>
        <el-form-item label="报销描述">
          <el-input
            v-model="reimbursementFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入报销描述"
          />
        </el-form-item>
        <el-form-item label="上传凭证">
          <el-upload
            ref="uploadRef"
            action="#"
            :http-request="handleFileChange"
            :file-list="uploadFileList"
            :limit="1"
            :on-remove="handleRemoveFile"
            :before-upload="(file) => {
              const isImage = file.type.startsWith('image/')
              const isLt2M = file.size / 1024 / 1024 < 2
              if (!isImage) {
                ElMessage.error('只能上传图片文件')
              }
              if (!isLt2M) {
                ElMessage.error('图片大小不能超过 2MB')
              }
              return isImage && isLt2M
            }"
          >
            <el-button type="primary" :loading="uploading">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
            <template #tip>
              <div style="font-size: 12px; color: #999; margin-top: 5px;">
                支持 jpg/png 格式，大小不超过 2MB
              </div>
            </template>
          </el-upload>

          <!-- 图片预览 -->
          <div v-if="previewImage" style="margin-top: 15px;">
            <div style="position: relative; display: inline-block;">
              <el-image
                :src="getImageUrl(previewImage)"
                fit="cover"
                style="width: 150px; height: 150px; border-radius: 4px;"
                :preview-src-list="[getImageUrl(previewImage)]"
              />
              <el-button
                type="danger"
                size="small"
                circle
                @click="handleRemoveFile"
                style="position: absolute; top: 5px; right: 5px;"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reimbursementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReimbursement" :loading="uploading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 报销详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="报销详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="currentReimbursement">
        <el-descriptions-item label="报销单号">{{ currentReimbursement.reimburseId }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ currentReimbursement.projectName }}</el-descriptions-item>
        <el-descriptions-item label="报销类型">{{ currentReimbursement.reimburseType }}</el-descriptions-item>
        <el-descriptions-item label="报销金额">¥{{ formatMoney(currentReimbursement.reimburseAmount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getReimbursementStatusType(currentReimbursement.status)">
            {{ getReimbursementStatusText(currentReimbursement.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentReimbursement.applyUserName }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ currentReimbursement.approvalUserName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentReimbursement.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ formatDate(currentReimbursement.approvalTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报销描述" :span="2">
          {{ currentReimbursement.description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="附件凭证" :span="2">
          <el-image
            v-if="currentReimbursement.attachmentPath"
            :src="getImageUrl(currentReimbursement.attachmentPath)"
            fit="cover"
            style="width: 200px; height: 200px; border-radius: 4px;"
            :preview-src-list="[getImageUrl(currentReimbursement.attachmentPath)]"
          />
          <span v-else style="color: #999;">无附件</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 500;
  font-size: 13px;
}

:deep(.el-descriptions__content) {
  font-size: 13px;
}

:deep(.el-descriptions--small .el-descriptions__label) {
  padding: 8px 12px;
}

:deep(.el-descriptions--small .el-descriptions__content) {
  padding: 8px 12px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  font-size: 13px;
  background-color: #fafafa;
}

:deep(.el-button--link) {
  color: #409EFF;
  text-decoration: none;
}

:deep(.el-button--link:hover) {
  color: #66b1ff;
}
</style>
