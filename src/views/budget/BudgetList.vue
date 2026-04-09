<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <h2 style="color: #2c3e50;">预算管理</h2>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增预算
        </el-button>
      </div>

      <el-card class="card-shadow">
        <el-table :data="tableData" stripe v-loading="loading">
          <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
          <el-table-column prop="budgetName" label="预算名称" width="150" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }">
              ¥{{ row.totalAmount?.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="usedAmount" label="已使用" width="120">
            <template #default="{ row }">
              ¥{{ row.usedAmount?.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="remaining" label="剩余金额" width="120">
            <template #default="{ row }">
              <span style="color: #27ae60; font-weight: bold;">
                ¥{{ row.remaining?.toLocaleString() }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBudgetsByProject } from '@/api/budget'

const tableData = ref([])
const loading = ref(false)

const handleAdd = () => {
  console.log('添加预算')
}

const handleEdit = (row) => {
  console.log('编辑预算', row)
}

const handleDelete = (row) => {
  console.log('删除预算', row)
}

const loadData = async () => {
  try {
    loading.value = true
    const res = await getBudgetsByProject(1)
    tableData.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const indexMethod = (index) => {
  return index + 1
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

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
