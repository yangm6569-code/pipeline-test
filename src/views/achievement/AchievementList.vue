<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <h2 style="color: #2c3e50; margin-bottom: 20px;">成果管理</h2>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="成果名称">
            <el-input v-model="searchForm.achievementName" placeholder="请输入成果名称" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="成果类型">
            <el-select v-model="searchForm.achievementType" placeholder="请选择类型" clearable style="width: 150px;">
              <el-option label="论文" value="论文" />
              <el-option label="专利" value="专利" />
              <el-option label="软件著作权" value="软件著作权" />
              <el-option label="科技奖励" value="科技奖励" />
              <el-option label="新产品" value="新产品" />
              <el-option label="新工艺" value="新工艺" />
            </el-select>
          </el-form-item>
          <el-form-item label="级别">
            <el-select v-model="searchForm.level" placeholder="请选择级别" clearable style="width: 150px;">
              <el-option label="国家级" value="国家级" />
              <el-option label="省级" value="省级" />
              <el-option label="市厅级" value="市厅级" />
              <el-option label="校级" value="校级" />
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
          <el-table-column prop="achievementName" label="成果名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="achievementType" label="成果类型" width="120" />
          <el-table-column prop="level" label="级别" width="100" />
          <el-table-column prop="projectName" label="所属项目" min-width="150" show-overflow-tooltip />
          <el-table-column prop="publishDate" label="完成时间" width="120" />
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleDetail(row)">详情</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

      <!-- 成果详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="成果详情"
        width="800px"
        :close-on-click-modal="false"
      >
        <el-descriptions :column="2" border v-if="detailData">
          <el-descriptions-item label="成果名称">{{ detailData.achievementName }}</el-descriptions-item>
          <el-descriptions-item label="成果类型">{{ detailData.achievementType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="级别">{{ detailData.level }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ detailData.projectName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ detailData.publishDate }}</el-descriptions-item>
          <el-descriptions-item label="作者/发明人">{{ detailData.publication || '-' }}</el-descriptions-item>
          <el-descriptions-item label="附件路径">{{ detailData.attachmentPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        </el-descriptions>

        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import request from '@/api/request'
import { exportExcel } from '@/utils/export'

const tableData = ref([])
const loading = ref(false)

const searchForm = ref({
  achievementName: '',
  achievementType: '',
  level: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const detailData = ref(null)

const indexMethod = (index) => {
  return (pagination.value.pageNum - 1) * pagination.value.pageSize + index + 1
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      achievementName: searchForm.value.achievementName || null,
      achievementType: searchForm.value.achievementType || null,
      level: searchForm.value.level || null,
      projectId: null,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }

    const res = await request({
      url: '/achievement/search',
      method: 'get',
      params
    })

    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      pagination.value.total = res.data.total || 0
      pagination.value.pageNum = res.data.pageNum || 1
      pagination.value.pageSize = res.data.pageSize || 10
    } else {
      throw new Error(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载成果数据失败:', error)
    ElMessage.error(error.message || '加载成果数据失败')
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
    achievementName: '',
    achievementType: '',
    level: ''
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
    const res = await request({
      url: `/achievement/${row.achievementId}`,
      method: 'get'
    })

    if (res.code === 200 && res.data) {
      detailData.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('加载成果详情失败:', error)
    ElMessage.error('加载成果详情失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除成果"${row.achievementName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request({
      url: `/achievement/${row.achievementId}`,
      method: 'delete'
    })

    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleExport = async () => {
  try {
    await exportExcel(
      '/achievement/export',
      {
        achievementName: searchForm.value.achievementName || null,
        achievementType: searchForm.value.achievementType || null,
        level: searchForm.value.level || null,
        projectId: null
      },
      '成果数据.xlsx'
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
