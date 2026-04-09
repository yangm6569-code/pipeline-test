<template>
  <div class="page-container">
    <div class="sidebar" style="width: 250px; background: #fff; border-right: 1px solid #e6e6e6; padding: 16px;">
      <h3 style="margin-bottom: 16px; color: #2c3e50;">部门结构</h3>
      <el-button type="primary" size="small" @click="handleAddRootDept" style="width: 100%; margin-bottom: 16px;">
        <el-icon><Plus /></el-icon>
        添加根节点
      </el-button>
      <el-tree
        :data="departmentTree"
        node-key="deptId"
        :props="{ label: 'deptName', children: 'children' }"
        default-expand-all
        :expand-on-click-node="false"
        @node-click="handleDepartmentNodeClick"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span style="flex: 1;">{{ node.label }}</span>
            <span>
              <el-button link type="primary" size="small" @click.stop="handleEditDept(data)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button link type="danger" size="small" @click.stop="handleDeleteDept(data)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </div>

    <div class="content" style="flex: 1; padding: 20px; overflow-y: auto; background-color: #f5f7fa;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin: 0;">用户管理</h2>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.realName" placeholder="请输入姓名" clearable style="width: 200px;" />
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
        <el-table :data="tableData" stripe v-loading="loading">
          <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="姓名" width="120" />
          <el-table-column prop="email" label="邮箱" width="200" />
          <el-table-column prop="phone" label="电话" width="120" />
          <el-table-column prop="departmentName" label="部门" width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" v-if="!isEdit">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="角色">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.roleId"
              :label="role.roleName"
              :value="role.roleId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="部门">
          <el-select v-model="form.departmentId" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in allDepartments"
              :key="dept.deptId"
              :label="dept.deptName"
              :value="dept.deptId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deptDialogVisible" :title="deptDialogTitle" width="500px">
      <el-form :model="deptForm" label-width="80px">
        <el-form-item label="部门名称">
          <el-input v-model="deptForm.deptName" placeholder="请输入部门名称" />
        </el-form-item>

        <el-form-item label="父级部门">
          <el-select v-model="deptForm.parentId" placeholder="请选择父级部门" style="width: 100%">
            <el-option
              v-for="dept in allDepartments"
              :key="dept.deptId"
              :label="dept.deptName"
              :value="dept.deptId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="层级">
          <el-select v-model="deptForm.level" placeholder="请选择层级" style="width: 100%">
            <el-option label="一级" :value="1" />
            <el-option label="二级" :value="2" />
            <el-option label="三级" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="deptForm.description"
            type="textarea"
            placeholder="请输入部门描述"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="deptForm.status">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDeptSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getDepartmentList,
  getDepartmentTree,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { exportExcel } from '@/utils/export'

const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const roleList = ref([])
const departmentTree = ref([])
const allDepartments = ref([])
const deptDialogVisible = ref(false)
const deptDialogTitle = ref('新增部门')
const isEditDept = ref(false)
const selectedDepartmentId = ref(null)

const searchForm = reactive({
  realName: '',
  departmentId: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  userId: null,
  username: '',
  password: '',
  roleId: null,
  departmentId: null,
  realName: '',
  email: '',
  phone: '',
  status: 1
})

const deptForm = reactive({
  deptId: null,
  deptName: '',
  parentId: null,
  level: 2,
  description: '',
  status: 1
})

const loadRoles = async () => {
  try {
    const res = await request.get('/role/list')
    roleList.value = res.data || []
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

const loadDepartmentTree = async () => {
  try {
    const res = await getDepartmentTree()
    departmentTree.value = res.data || []
  } catch (error) {
    console.error('加载部门树失败:', error)
  }
}

const loadAllDepartments = async () => {
  try {
    const res = await getAllDepartments()
    allDepartments.value = res.data || []
  } catch (error) {
    console.error('加载所有部门失败:', error)
  }
}

const loadData = async () => {
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      realName: searchForm.realName || undefined,
      departmentId: selectedDepartmentId.value || undefined
    }
    const res = await getUserList(params)
    console.log('用户数据响应:', res)
    tableData.value = res.data?.list || res.data?.records || res.data || []
    pagination.total = res.data?.total || 0
    console.log('表格数据:', tableData.value)
  } catch (error) {
    console.error('加载用户数据失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadData()
}

const handleReset = () => {
  searchForm.realName = ''
  selectedDepartmentId.value = null
  pagination.pageNum = 1
  loadData()
}

const handleExport = async () => {
  try {
    await exportExcel(
      '/user/export',
      {
        realName: searchForm.realName || null,
        departmentId: selectedDepartmentId.value || null
      },
      '用户数据.xlsx'
    )
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  }
}

const handlePageChange = (page) => {
  pagination.pageNum = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  Object.assign(form, {
    userId: null,
    username: '',
    password: '',
    roleId: null,
    departmentId: null,
    realName: '',
    email: '',
    phone: '',
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(form, {
    userId: row.userId,
    username: row.username,
    password: '',
    roleId: row.roleId,
    departmentId: row.departmentId,
    realName: row.realName,
    email: row.email,
    phone: row.phone,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认要删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteUser(row.userId)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleSubmit = async () => {
  try {
    if (!isEdit.value && !form.password) {
      ElMessage.warning('请输入密码')
      return
    }

    if (!form.roleId) {
      ElMessage.warning('请选择角色')
      return
    }

    const submitData = { ...form }
    if (isEdit.value && !submitData.password) {
      delete submitData.password
    }

    if (isEdit.value) {
      await updateUser(form.userId, submitData)
      ElMessage.success('更新成功')
    } else {
      await request.post('/user', submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error(error)
    ElMessage.error(error.response?.data?.message || error.message || '操作失败')
  }
}

const handleAddRootDept = () => {
  isEditDept.value = false
  deptDialogTitle.value = '新增根节点'
  Object.assign(deptForm, {
    deptId: null,
    deptName: '',
    parentId: null,
    level: 1,
    description: '',
    status: 1
  })
  deptDialogVisible.value = true
}

const handleEditDept = (data) => {
  isEditDept.value = true
  deptDialogTitle.value = '编辑部门'
  Object.assign(deptForm, {
    deptId: data.deptId,
    deptName: data.deptName,
    parentId: data.parentId,
    level: data.level,
    description: data.description,
    status: data.status
  })
  deptDialogVisible.value = true
}

const handleDeleteDept = async (data) => {
  try {
    await ElMessageBox.confirm(`确认要删除部门"${data.deptName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteDepartment(data.deptId)
    ElMessage.success('删除成功')
    loadDepartmentTree()
    loadAllDepartments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleDeptSubmit = async () => {
  try {
    if (!deptForm.deptName) {
      ElMessage.warning('请输入部门名称')
      return
    }

    if (isEditDept.value) {
      await updateDepartment(deptForm.deptId, deptForm)
      ElMessage.success('更新成功')
    } else {
      await createDepartment(deptForm)
      ElMessage.success('创建成功')
    }
    deptDialogVisible.value = false
    loadDepartmentTree()
    loadAllDepartments()
  } catch (error) {
    console.error(error)
    ElMessage.error(error.response?.data?.message || error.message || '操作失败')
  }
}

const handleDepartmentNodeClick = (data) => {
  selectedDepartmentId.value = data.deptId
  pagination.pageNum = 1
  loadData()
}

onMounted(() => {
  loadRoles()
  loadDepartmentTree()
  loadAllDepartments()
  loadData()
})
</script>

<style scoped>
.page-container {
  display: flex;
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

h3 {
  margin: 0;
  font-size: 16px;
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

:deep(.custom-tree-node) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

.search-form {
  margin-bottom: 0;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
}
</style>
