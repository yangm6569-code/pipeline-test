<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin: 0;">项目管理</h2>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增项目
        </el-button>
      </div>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="项目名称">
            <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="项目类型">
            <el-select v-model="searchForm.projectType" placeholder="请选择类型" clearable style="width: 150px;">
              <el-option label="国家级" value="国家级" />
              <el-option label="省级" value="省级" />
              <el-option label="市厅级" value="市厅级" />
              <el-option label="校级" value="校级" />
              <el-option label="横向" value="横向" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
              <el-option label="申报中" value="申报中" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="结题" value="结题" />
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
          <el-table-column prop="projectNo" label="项目编号" width="120" />
          <el-table-column prop="projectName" label="项目名称" min-width="200" />
          <el-table-column prop="projectType" label="项目类型" width="100" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="280">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
              <el-button v-if="!isProjectApplyingStatus(row.status)" size="small" type="info" @click="handleDetail(row)">报销</el-button>
              <el-button v-if="!isProjectApplyingStatus(row.status)" size="small" type="primary" @click="showProcessDetail(row)">详情</el-button>
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

      <!-- 新增/编辑项目对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="900px"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目编号" prop="projectNo">
                <el-input v-model="formData.projectNo" placeholder="请输入项目编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectName">
                <el-input v-model="formData.projectName" placeholder="请输入项目名称" clearable />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="项目类型" prop="projectType">
                <el-select v-model="formData.projectType" placeholder="请选择项目类型" style="width: 100%;">
                  <el-option label="国家级" value="国家级" />
                  <el-option label="省级" value="省级" />
                  <el-option label="市厅级" value="市厅级" />
                  <el-option label="校级" value="校级" />
                  <el-option label="横向" value="横向" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="领域" prop="field">
                <el-select v-model="formData.field" placeholder="请选择领域" clearable style="width: 100%;">
                  <el-option label="论文" value="论文" />
                  <el-option label="专利" value="专利" />
                  <el-option label="软件著作权" value="软件著作权" />
                  <el-option label="科技奖励" value="科技奖励" />
                  <el-option label="新产品" value="新产品" />
                  <el-option label="新工艺" value="新工艺" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  style="width: 100%;"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  style="width: 100%;"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="总经费 (元)" prop="totalFund">
                <el-input-number
                  v-model="formData.totalFund"
                  :min="0"
                  :precision="2"
                  placeholder="请输入总经费"
                  style="width: 100%;"
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>


          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="项目描述" prop="description">
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入项目描述"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>预算明细</el-divider>

          <el-row :gutter="20">
            <el-col :span="24">
              <div style="margin-bottom: 10px;">
                <el-button type="primary" size="small" @click="addBudgetItem">
                  <el-icon><Plus /></el-icon>
                  添加预算
                </el-button>
              </div>
              <el-table :data="formData.budgets" border style="width: 100%;">
                <el-table-column label="预算类型" width="200">
                  <template #default="{ row, $index }">
                    <el-select v-model="row.budgetType" placeholder="请选择预算类型" style="width: 100%;">
                      <el-option label="设备费" value="设备费" />
                      <el-option label="材料费" value="材料费" />
                      <el-option label="测试化验加工费" value="测试化验加工费" />
                      <el-option label="燃料动力费" value="燃料动力费" />
                      <el-option label="差旅费" value="差旅费" />
                      <el-option label="会议费" value="会议费" />
                      <el-option label="国际合作与交流费" value="国际合作与交流费" />
                      <el-option label="出版/文献/信息传播/知识产权事务费" value="出版/文献/信息传播/知识产权事务费" />
                      <el-option label="劳务费" value="劳务费" />
                      <el-option label="专家咨询费" value="专家咨询费" />
                      <el-option label="其他支出" value="其他支出" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="预算金额 (元)" width="200">
                  <template #default="{ row, $index }">
                    <el-input-number
                      v-model="row.budgetAmount"
                      :min="0"
                      :precision="2"
                      :step="100"
                      placeholder="请输入金额"
                      style="width: 100%;"
                      @change="calculateTotalFund"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="预算年度" width="150">
                  <template #default="{ row, $index }">
                    <el-input-number
                      v-model="row.fiscalYear"
                      :min="2020"
                      :max="2030"
                      placeholder="请输入年度"
                      style="width: 100%;"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ $index }">
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeBudgetItem($index)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div style="margin-top: 10px; text-align: right; font-weight: bold;">
                预算总额：¥{{ totalBudgetAmount.toFixed(2) }}
                <el-tag
                  :type="totalBudgetAmount === formData.totalFund ? 'success' : 'danger'"
                  style="margin-left: 10px;"
                >
                  {{ totalBudgetAmount === formData.totalFund ? '匹配' : '不匹配' }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectList, createProject, updateProject, deleteProject, getProjectById } from '@/api/project'
import { Plus, Search, Refresh, Delete, Download } from '@element-plus/icons-vue'
import { exportExcel } from '@/utils/export'
import { isProjectApplyingStatus } from '@/utils/permission'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)

const searchForm = ref({
  projectName: '',
  projectType: '',
  status: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const formData = ref({
  projectId: null,
  projectName: '',
  projectNo: '',
  projectType: '',
  field: '',
  leaderId: null,
  departmentId: null,
  startDate: '',
  endDate: '',
  totalFund: 0,
  description: '',
  budgets: []
})

const formRules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

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

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      projectName: searchForm.value.projectName || null,
      projectType: searchForm.value.projectType || null,
      departmentId: null,
      status: searchForm.value.status || null,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }

    const res = await getProjectList(params)

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
    console.error('加载项目数据失败:', error)
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
    projectType: '',
    status: ''
  }
  pagination.value.pageNum = 1
  loadData()
}

const handleExport = async () => {
  try {
    await exportExcel(
      '/project/export',
      {
        projectName: searchForm.value.projectName || null,
        projectType: searchForm.value.projectType || null,
        departmentId: null,
        status: searchForm.value.status || null
      },
      '项目数据.xlsx'
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

const handleAdd = () => {
  dialogTitle.value = '新增项目'
  formData.value = {
    projectId: null,
    projectName: '',
    projectNo: '',
    projectType: '',
    field: '',
    leaderId: null,
    departmentId: null,
    startDate: '',
    endDate: '',
    totalFund: 0,
    description: '',
    budgets: []
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑项目'
  formData.value = {
    projectId: row.projectId,
    projectName: row.projectName || '',
    projectNo: row.projectNo || '',
    projectType: row.projectType || '',
    field: row.field || '',
    leaderId: row.leaderId || null,
    departmentId: row.departmentId || null,
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    totalFund: row.totalFund || 0,
    description: row.description || '',
    budgets: row.budgets || []
  }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除项目"${row.projectName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteProject(row.projectId)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleDetail = (row) => {
  router.push(`/project/detail/${row.projectId}`)
}

const showProcessDetail = (row) => {
  router.push(`/project/process/${row.projectId}`)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!formData.value.budgets || formData.value.budgets.length === 0) {
      ElMessage.error('请至少添加一条预算明细')
      return
    }

    if (totalBudgetAmount.value !== formData.value.totalFund) {
      ElMessage.error('预算总额必须等于总经费')
      return
    }

    try {
      if (formData.value.projectId) {
        await updateProject(formData.value)
        ElMessage.success('更新成功')
      } else {
        await createProject(formData.value)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      loadData()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  })
}

const addBudgetItem = () => {
  formData.value.budgets.push({
    budgetType: '',
    budgetAmount: 0,
    fiscalYear: new Date().getFullYear()
  })
  calculateTotalFund()
}

const removeBudgetItem = (index) => {
  formData.value.budgets.splice(index, 1)
  calculateTotalFund()
}

const calculateTotalFund = () => {
  const total = formData.value.budgets.reduce((sum, item) => {
    return sum + (item.budgetAmount || 0)
  }, 0)
  formData.value.totalFund = total
}

const totalBudgetAmount = computed(() => {
  return formData.value.budgets.reduce((sum, item) => {
    return sum + (item.budgetAmount || 0)
  }, 0)
})

const indexMethod = (index) => {
  return (pagination.value.pageNum - 1) * pagination.value.pageSize + index + 1
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
