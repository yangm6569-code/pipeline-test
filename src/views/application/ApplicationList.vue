<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <h2 style="color: #2c3e50; margin-bottom: 20px;">申请审批</h2>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="项目名称">
            <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="申请人姓名">
            <el-input v-model="searchForm.applyUserName" placeholder="请输入申请人姓名" clearable style="width: 150px;" />
          </el-form-item>
          <el-form-item label="审批状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
              <el-option label="待审批" value="待审批" />
              <el-option label="已通过" value="已通过" />
              <el-option label="已拒绝" value="已拒绝" />
            </el-select>
          </el-form-item>
          <el-form-item label="当前节点">
            <el-select v-model="searchForm.currentNode" placeholder="请选择节点" clearable style="width: 120px;">
              <el-option label="初审" value="初审" />
              <el-option label="复审" value="复审" />
              <el-option label="终审" value="终审" />
              <el-option label="已完成" value="已完成" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="card-shadow">
        <el-table :data="tableData" stripe v-loading="loading" style="width: 100%;">
          <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
          <el-table-column prop="projectName" label="项目名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="applyUserName" label="申请人" width="100" />
          <el-table-column prop="applyContent" label="申请内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="currentNode" label="当前节点" width="100" />
          <el-table-column prop="approvalStatus" label="审批状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.approvalStatus)">{{ getStatusText(row.approvalStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="applyTime" label="申请时间" width="160" />
          <el-table-column label="操作" fixed="right" width="280">
            <template #default="{ row }">
              <el-button size="small" type="info" @click="handleDetail(row)">流程详情</el-button>
              <el-button size="small" type="success" @click="handleApprove(row)" :disabled="row.approvalStatus !== '待审批'">通过</el-button>
              <el-button size="small" type="danger" @click="handleReject(row)" :disabled="row.approvalStatus !== '待审批'">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>

      <!-- 申请详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="申请详情"
        width="900px"
        :close-on-click-modal="false"
      >
        <el-descriptions :column="2" border v-if="detailData.application">
          <el-descriptions-item label="项目名称">{{ detailData.application.projectName }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ detailData.application.applyUserName }}</el-descriptions-item>
          <el-descriptions-item label="申请内容" :span="2">{{ detailData.application.applyContent }}</el-descriptions-item>
          <el-descriptions-item label="当前节点">{{ detailData.application.currentNode }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="getStatusType(detailData.application.approvalStatus)">
              {{ getStatusText(detailData.application.approvalStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ detailData.application.applyTime }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>审批记录</el-divider>

        <el-table :data="detailData.approvalRecords" border style="margin-top: 10px;">
          <el-table-column prop="nodeType" label="节点类型" width="120" />
          <el-table-column prop="approverName" label="审批人" width="100">
            <template #default="{ row }">
              {{ row.approverName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="approvalResult" label="审批结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.approvalResult === '已通过' ? 'success' : row.approvalResult === '已拒绝' ? 'danger' : 'info'">
                {{ row.approvalResult }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approvalOpinion" label="审批意见" min-width="200" show-overflow-tooltip />
          <el-table-column prop="approvalTime" label="审批时间" width="160" />
          <el-table-column prop="orderNum" label="顺序" width="80" />
        </el-table>

        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import { searchApplications, approveApplication, rejectApplication, getApplicationDetail } from '@/api/application'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { exportExcel } from '@/utils/export'

const tableData = ref([])
const loading = ref(false)

const searchForm = ref({
  projectName: '',
  applyUserName: '',
  status: '',
  currentNode: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const detailData = ref({
  application: null,
  approvalRecords: []
})

const indexMethod = (index) => {
  return (pagination.value.pageNum - 1) * pagination.value.pageSize + index + 1
}

const getStatusType = (status) => {
  const types = {
    '待审批': 'warning',
    '已通过': 'success',
    '已拒绝': 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  return status || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      projectName: searchForm.value.projectName || null,
      applyUserName: searchForm.value.applyUserName || null,
      status: searchForm.value.status || null,
      currentNode: searchForm.value.currentNode || null,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }

    const res = await searchApplications(params)

    if (res.data) {
      tableData.value = res.data.list || []
      pagination.value.total = res.data.total || 0
      pagination.value.pageNum = res.data.pageNum || 1
      pagination.value.pageSize = res.data.pageSize || 10
    } else {
      tableData.value = []
      pagination.value.total = 0
    }
  } catch (error) {
    console.error('加载申请数据失败:', error)
    tableData.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    projectName: '',
    applyUserName: '',
    status: '',
    currentNode: ''
  }
  pagination.value.pageNum = 1
  loadData()
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  loadData()
}

const handleCurrentChange = (val) => {
  pagination.value.pageNum = val
  loadData()
}

const handleDetail = async (row) => {
  try {
    const res = await getApplicationDetail(row.applyId)
    if (res.data) {
      detailData.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('加载申请详情失败:', error)
    ElMessage.error('加载申请详情失败')
  }
}

const handleApprove = async (row) => {
  try {
    const { value: opinion } = await ElMessageBox.prompt('请输入审批意见', '通过申请', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入审批意见',
      inputType: 'textarea'
    })

    await approveApplication(row.applyId, opinion)
    ElMessage.success('审批通过')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审批失败:', error)
      ElMessage.error('审批失败')
    }
  }
}

const handleReject = async (row) => {
  try {
    const { value: opinion } = await ElMessageBox.prompt('请输入拒绝理由', '拒绝申请', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝理由',
      inputType: 'textarea'
    })

    await rejectApplication(row.applyId, opinion)
    ElMessage.success('已拒绝')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error)
      ElMessage.error('拒绝失败')
    }
  }
}

const handleExport = async () => {
  try {
    await exportExcel(
      '/application/export',
      {
        projectName: searchForm.value.projectName || null,
        applyUserName: searchForm.value.applyUserName || null,
        status: searchForm.value.status || null,
        currentNode: searchForm.value.currentNode || null
      },
      '申请数据.xlsx'
    )
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  }
}

onMounted(() => {
  loadData()
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

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.card-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.search-form {
  margin-bottom: 0;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}

:deep(.el-pagination) {
  display: flex;
  justify-content: flex-end;
}
</style>
