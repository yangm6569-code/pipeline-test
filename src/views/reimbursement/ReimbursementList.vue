<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applyUserName" placeholder="请输入申请人姓名" clearable />
        </el-form-item>
        <el-form-item label="报销类型">
          <el-select v-model="searchForm.reimburseType" placeholder="请选择或输入报销类型" clearable filterable allow-create default-first-option style="width: 200px;">
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择或输入状态" clearable filterable allow-create default-first-option style="width: 150px;">
            <el-option label="待审批" value="待审批" />
            <el-option label="已审批" value="已审批" />
            <el-option label="已拒绝" value="已拒绝" />
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
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" :index-method="indexMethod" />
        <el-table-column prop="reimburseType" label="报销类型" min-width="120" />
        <el-table-column prop="reimburseAmount" label="金额 (元)" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="项目名称" min-width="150" />
        <el-table-column prop="applyUserName" label="申请人" width="100" />
        <el-table-column prop="approvalUserName" label="审批人" width="100" />
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column prop="approvalTime" label="审批时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === '待审批'"
              type="success"
              link
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === '待审批'"
              type="danger"
              link
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
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
    </div>

    <!-- 报销详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="报销详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="currentReimbursement">
        <el-descriptions-item label="报销单号">{{ currentReimbursement.reimburseId }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ currentReimbursement.projectName || '-' }}</el-descriptions-item>
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
        <el-button
          v-if="currentReimbursement?.status === '待审批'"
          type="success"
          @click="handleApproveFromDetail"
        >
          通过
        </el-button>
        <el-button
          v-if="currentReimbursement?.status === '待审批'"
          type="danger"
          @click="handleRejectFromDetail"
        >
          拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Upload, Delete, Download } from '@element-plus/icons-vue'
import request from '@/api/request'
import { exportExcel } from '@/utils/export'
import { getFileViewUrl } from '@/utils/downLoadpicture'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)

const searchForm = ref({
  projectName: '',
  applyUserName: '',
  reimburseType: '',
  status: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const currentReimbursement = ref(null)

const getStatusType = (status) => {
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

const getStatusText = (status) => {
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

const getReimbursementStatusType = (status) => {
  return getStatusType(status)
}

const getReimbursementStatusText = (status) => {
  return getStatusText(status)
}

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ')
}

const indexMethod = (index) => {
  return (pagination.value.pageNum - 1) * pagination.value.pageSize + index + 1
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      projectName: searchForm.value.projectName || null,
      applyUserName: searchForm.value.applyUserName || null,
      reimburseType: searchForm.value.reimburseType || null,
      status: searchForm.value.status || null
    }

    const res = await request({
      url: '/reimbursement/page',
      method: 'get',
      params
    })

    if (res.data) {
      tableData.value = res.data.list || []
      pagination.value.total = res.data.total || 0
    } else {
      tableData.value = []
      pagination.value.total = 0
    }
  } catch (error) {
    console.error('加载报销数据失败:', error)
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
    reimburseType: '',
    status: ''
  }
  pagination.value.pageNum = 1
  loadData()
}

const handleExport = async () => {
  try {
    await exportExcel(
      '/reimbursement/export',
      {
        status: searchForm.value.status || null,
        reimburseType: searchForm.value.reimburseType || null,
        minAmount: null,
        maxAmount: null,
        projectName: searchForm.value.projectName || null,
        applyUserName: searchForm.value.applyUserName || null
      },
      '报销数据.xlsx'
    )
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  }
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  loadData()
}

const handleCurrentChange = (val) => {
  pagination.value.pageNum = val
  loadData()
}

const handleViewDetail = (row) => {
  currentReimbursement.value = row
  detailDialogVisible.value = true
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要通过这笔报销吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request({
      url: `/reimbursement/${row.reimburseId}/approve`,
      method: 'post'
    })

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
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝理由', '拒绝报销', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝理由',
      inputType: 'textarea',
      inputPlaceholder: '请填写拒绝原因'
    })

    await request({
      url: `/reimbursement/${row.reimburseId}/reject`,
      method: 'post',
      params: { reason }
    })

    ElMessage.success('已拒绝')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error)
      ElMessage.error('拒绝失败')
    }
  }
}

const handleApproveFromDetail = async () => {
  if (currentReimbursement.value) {
    await handleApprove(currentReimbursement.value)
    detailDialogVisible.value = false
  }
}

const handleRejectFromDetail = async () => {
  if (currentReimbursement.value) {
    await handleReject(currentReimbursement.value)
    detailDialogVisible.value = false
  }
}

const getImageUrl = (path) => {
  if (!path) return ''
  return getFileViewUrl(path)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
}

.search-bar {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
