<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <!-- 页面标题 -->
      <h2 style="color: #2c3e50; margin-bottom: 20px;">项目流程审批</h2>

      <!-- 添加一个调试信息，确保模板被渲染 -->
      <div v-if="false">调试：组件已加载</div>

      <!-- 查询条件 -->
      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <el-form :model="queryParams" label-width="80px" size="small">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="流程阶段">
                <el-input v-model="queryParams.stage" placeholder="请输入流程阶段" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="审批状态">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 100%;">
                  <el-option label="审批中" value="审批中" />
                  <el-option label="已通过" value="已通过" />
                  <el-option label="已拒绝" value="已拒绝" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="审批人">
                <el-input v-model="queryParams.approverName" placeholder="请输入审批人姓名" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="timeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  style="width: 100%;"
                  @change="handleTimeRangeChange"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item>
                <el-button type="primary" @click="search">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="reset">
                  <el-icon><component :is="Refresh" /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 数据表格 -->
      <el-card v-loading="loading" class="card-shadow">
        <el-table :data="processList" stripe style="width: 100%;" size="small">
          <el-table-column prop="projectName" label="项目名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="stage" label="流程阶段" width="120" />
          <el-table-column prop="status" label="审批状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approverName" label="审批人" width="100">
            <template #default="scope">
              {{ scope.row.approverName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="approvalOpinion" label="审批意见" min-width="150" show-overflow-tooltip />
          <el-table-column prop="submitTime" label="提交时间" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.submitTime) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="operationTime"
            label="操作时间"
            width="180"
            v-if="false">
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="260">
            <template #default="scope">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <el-button
                  size="small"
                  @click="viewProcessDetail(scope.row)"
                >
                  查看详情
                </el-button>
                <template v-if="scope.row.status === '审批中'">
                  <el-button
                    size="small"
                    type="success"
                    @click="approveProcess(scope.row)"
                  >
                    通过
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="rejectProcess(scope.row)"
                  >
                    拒绝
                  </el-button>
                </template>
                <template v-else>
                  <el-tag v-if="scope.row.status === '已通过'" type="success">已通过</el-tag>
                  <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>

      <!-- 审批意见对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="400px"
      >
        <el-form :model="approvalForm" label-width="80px" size="small">
          <el-form-item label="审批意见" required>
            <el-input
              v-model="approvalForm.approvalOpinion"
              type="textarea"
              :rows="3"
              placeholder="请输入审批意见"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmApproval" :loading="approving">
            确定
          </el-button>
        </template>
      </el-dialog>

      <!-- 流程详情对话框 -->
      <el-dialog
        v-model="processDetailVisible"
        title="流程详情"
        width="700px"
      >
        <div v-loading="detailLoading">
          <el-descriptions v-if="processDetail" :column="2" border size="small">
            <el-descriptions-item label="流程ID">{{ processDetail.processId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="项目ID">{{ processDetail.projectId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="项目名称">{{ processDetail.projectName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程阶段">{{ processDetail.stage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审批状态">
              <el-tag :type="getStatusType(processDetail.status)">
                {{ processDetail.status || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="阶段顺序">{{ processDetail.orderNum ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="审批人">{{ processDetail.approverName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDate(processDetail.submitTime) }}</el-descriptions-item>
            <el-descriptions-item label="操作时间">{{ formatDate(processDetail.operationTime) }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDate(processDetail.startDate) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDate(processDetail.endDate) }}</el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">
              {{ processDetail.approvalOpinion || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="附件" :span="2">
              <div v-if="processDetail.filePaths.length > 0" class="attachment-grid">
                <div
                  v-for="(filePath, index) in processDetail.filePaths"
                  :key="`${filePath}-${index}`"
                  class="attachment-card"
                  @click="downloadAttachment(filePath)"
                >
                  <div class="attachment-thumb">
                    <el-icon size="22" color="#3f8cff"><Document /></el-icon>
                    <span class="attachment-ext">{{ getFileExtension(filePath) }}</span>
                  </div>
                  <div class="attachment-name" :title="getFileNameFromPath(filePath)">
                    {{ getFileNameFromPath(filePath) }}
                  </div>
                  <div class="attachment-tip">点击下载</div>
                </div>
              </div>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无流程详情" />
        </div>
        <template #footer>
          <el-button @click="processDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 从正确的包导入图标
import { Search, Refresh, Document } from '@element-plus/icons-vue'
import request from '@/api/request'
import { downloadFileByBlob, getFileNameFromPath as getFileNameFromAbsolutePath } from '@/utils/downLoadpicture'

// 查询参数
const queryParams = ref({
  projectId: null,
  stage: '',
  status: '',
  approverName: '',
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 10
})

// 时间范围选择器
const timeRange = ref([])

// 表格数据
const processList = ref([])
const total = ref(0)
const loading = ref(false)

// 审批相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const approvalForm = ref({
  processId: null,
  approved: false,
  approvalOpinion: '',
  approverName: ''
})
const approving = ref(false)

// 详情相关
const processDetailVisible = ref(false)
const detailLoading = ref(false)
const processDetail = ref(null)

// 获取状态标签类型
const getStatusType = (status) => {
  if (status === '已通过') return 'success'
  if (status === '已拒绝') return 'danger'
  if (status === '审批中') return 'warning'
  return 'info'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ')
}

const parseFilePaths = (filePaths) => {
  if (!filePaths) return []
  if (Array.isArray(filePaths)) return filePaths.filter(Boolean)
  return String(filePaths)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const normalizeProcessDetail = (data) => {
  return {
    ...data,
    filePaths: parseFilePaths(data?.filePaths)
  }
}

const getFileNameFromPath = (filePath) => {
  return getFileNameFromAbsolutePath(filePath)
}

const getFileExtension = (filePath) => {
  const fileName = getFileNameFromPath(filePath)
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return 'FILE'
  }
  return fileName.slice(dotIndex + 1).toUpperCase().slice(0, 6)
}

const downloadAttachment = async (filePath) => {
  if (!filePath) return
  try {
    await downloadFileByBlob(filePath, getFileNameFromPath(filePath))
  } catch (error) {
    console.error('下载附件失败:', error)
    ElMessage.error('下载附件失败')
  }
}

// 处理时间范围变化
const handleTimeRangeChange = (value) => {
  if (value && value.length === 2) {
    queryParams.value.startTime = new Date(value[0]).toISOString()
    queryParams.value.endTime = new Date(value[1]).toISOString()
  } else {
    queryParams.value.startTime = ''
    queryParams.value.endTime = ''
  }
}

// 查询数据
const search = async () => {
  queryParams.value.pageNum = 1
  await loadProcesses()
}

// 重置查询条件
const reset = () => {
  queryParams.value = {
    projectId: null,
    stage: '',
    status: '',
    approverName: '',
    startTime: '',
    endTime: '',
    pageNum: 1,
    pageSize: 10
  }
  timeRange.value = []
  search()
}

// 加载流程列表
const loadProcesses = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/process/page',
      method: 'get',
      params: queryParams.value
    })

    if (res.code === 200 && res.data) {
      processList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      throw new Error(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载流程列表失败:', error)
    ElMessage.error(error.message || '加载流程列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handleSizeChange = (val) => {
  queryParams.value.pageSize = val
  loadProcesses()
}

const handleCurrentChange = (val) => {
  queryParams.value.pageNum = val
  loadProcesses()
}

// 查看流程详情
const viewProcessDetail = async (row) => {
  if (!row?.processId) {
    ElMessage.warning('流程ID不存在')
    return
  }

  processDetailVisible.value = true
  detailLoading.value = true
  processDetail.value = null

  try {
    const res = await request({
      url: `/process/${row.processId}`,
      method: 'get'
    })

    if (res.code === 200 && res.data) {
      processDetail.value = normalizeProcessDetail(res.data)
    } else {
      throw new Error(res.message || '加载流程详情失败')
    }
  } catch (error) {
    console.error('加载流程详情失败:', error)
    ElMessage.error(error.message || '加载流程详情失败')
    processDetailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

// 审批通过
const approveProcess = (row) => {
  approvalForm.value.processId = row.processId
  approvalForm.value.approved = true
  approvalForm.value.approvalOpinion = ''
  dialogTitle.value = '审批通过'
  dialogVisible.value = true
}

// 拒绝审批
const rejectProcess = (row) => {
  approvalForm.value.processId = row.processId
  approvalForm.value.approved = false
  approvalForm.value.approvalOpinion = ''
  dialogTitle.value = '拒绝审批'
  dialogVisible.value = true
}

// 确认审批
const confirmApproval = async () => {
  if (!approvalForm.value.approvalOpinion.trim()) {
    ElMessage.warning('请输入审批意见')
    return
  }

  try {
    approving.value = true

    const res = await request({
      url: '/process/approve',
      method: 'put',
      data: approvalForm.value
    })

    if (res.code === 200) {
      ElMessage.success('审批成功')
      dialogVisible.value = false
      // 重新加载数据
      await loadProcesses()
    } else {
      throw new Error(res.message || '审批失败')
    }
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.message || '审批失败')
  } finally {
    approving.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadProcesses()
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.attachment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.attachment-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  background-color: #fafcff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.attachment-card:hover {
  border-color: #3f8cff;
  box-shadow: 0 6px 18px rgba(63, 140, 255, 0.14);
  transform: translateY(-1px);
}

.attachment-thumb {
  height: 78px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f2f7ff 0%, #edf3ff 100%);
  border: 1px solid #dfe8ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.attachment-ext {
  font-size: 11px;
  line-height: 1;
  color: #3f8cff;
  font-weight: 600;
}

.attachment-name {
  font-size: 13px;
  line-height: 1.4;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
