<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import StatCard from '@/components/StatCard.vue'
import { useUserStore } from '@/stores/user'
import { getProjectOverview } from '@/api/project'
import { getTodoOverview } from '@/api/dashboard'

const router = useRouter()
const userStore = useUserStore()

const stats = ref([])
const loading = ref(false)

const todoLoading = ref(false)
const todoSummary = ref([])
const submitStageTodos = ref([])
const submitStageCount = ref(0)

const chartLoading = ref(false)
const budgetDataset = ref([])
const budgetChartRef = ref(null)
let budgetChart = null

const isAdminRole = computed(() => {
  const roleName = userStore.userInfo?.roleName || ''
  const roleKey = userStore.roleKey || ''
  return roleName === '管理员' || roleKey === 'admin'
})

const visibleTodoSummary = computed(() => {
  return todoSummary.value.filter(item => {
    if (item.key === 'processApproval') {
      return isAdminRole.value
    }
    if (item.key === 'processSubmit') {
      return !isAdminRole.value
    }
    return true
  })
})

const getNumberByKeys = (source, keys = [], fallback = 0) => {
  for (const key of keys) {
    const value = Number(source?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return fallback
}

const getArrayByKeys = (source, keys = []) => {
  for (const key of keys) {
    const value = source?.[key]
    if (Array.isArray(value)) {
      return value
    }
  }
  return []
}

const toAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

const formatMoney = (value) => {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`
}

const formatMoneyShort = (value) => {
  const n = Number(value || 0)
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return `${Math.round(n)}`
}

const buildStats = (overview = {}) => {
  const statusGroups = Array.isArray(overview.statusGroups) ? overview.statusGroups : []
  const statusCountMap = statusGroups.reduce((map, item) => {
    map[item.status] = Number(item.count) || 0
    return map
  }, {})

  const totalProjects = Number(overview.totalProjects)
  const totalCount = Number.isFinite(totalProjects)
    ? totalProjects
    : statusGroups.reduce((sum, item) => sum + (Number(item.count) || 0), 0)

  return [
    { title: '总项目数', value: totalCount, icon: 'Document', color: '#409EFF' },
    { title: '申报中项目', value: statusCountMap['申报中'] || 0, icon: 'Bell', color: '#E6A23C' },
    { title: '进行中项目', value: statusCountMap['进行中'] || 0, icon: 'VideoPlay', color: '#67C23A' },
    { title: '已完成项目', value: statusCountMap['已完成'] || 0, icon: 'SuccessFilled', color: '#F56C6C' }
  ]
}

const normalizeSubmitStageTodo = (item = {}) => {
  return {
    projectId: item.projectId || item.id || item.project?.id || null,
    projectName: item.projectName || item.name || item.project?.name || '-',
    stage: item.stage || item.currentStage || item.nextStage || item.stageName || '-'
  }
}

const buildTodo = (todoData = {}) => {
  const submitList = getArrayByKeys(todoData, [
    'pendingSubmitStages',
    'submitStageTodos',
    'needSubmitStages',
    'processSubmitStages'
  ])
    .map(normalizeSubmitStageTodo)
    .filter(item => item.projectId || item.projectName !== '-')

  const reimbursementApprovalCount = getNumberByKeys(todoData, [
    'pendingReimbursementApprovalCount',
    'reimbursementApprovalCount',
    'pendingReimbursementCount'
  ])

  const processApprovalCount = getNumberByKeys(todoData, [
    'pendingProcessApprovalCount',
    'processApprovalCount',
    'pendingApproveProcessCount'
  ])

  const pendingSubmitCount = getNumberByKeys(
    todoData,
    ['pendingSubmitStageCount', 'processSubmitCount', 'needSubmitStageCount'],
    submitList.length
  )

  return {
    summary: [
      { key: 'reimbursement', title: '审批报销', count: reimbursementApprovalCount, route: '/reimbursement', actionText: '去审批' },
      { key: 'processApproval', title: '审批项目流程', count: processApprovalCount, route: '/project/process-approval', actionText: '去审批' },
      { key: 'processSubmit', title: '待提交流程阶段', count: pendingSubmitCount, route: '/project/list', actionText: '去处理' }
    ],
    submitList,
    submitStageCount: pendingSubmitCount
  }
}

const buildCostDatasetFromOverview = (overview = {}) => {
  const rows = Array.isArray(overview?.costComparison) ? overview.costComparison : []
  return rows.map((item, index) => {
    const projectId = item.id ?? item.projectId ?? `project-${index}`
    const projectName = item.name || item.projectName || `项目${index + 1}`
    return {
      projectId,
      projectName,
      budget: toAmount(item.budgetAmount),
      actual: toAmount(item.actualExpenseAmount)
    }
  })
    .sort((a, b) => (b.budget + b.actual) - (a.budget + a.actual))
    .slice(0, 8)
}

const renderBudgetChart = () => {
  if (!budgetChartRef.value || budgetDataset.value.length === 0) return

  if (!budgetChart) {
    budgetChart = echarts.init(budgetChartRef.value)
  }

  const categories = budgetDataset.value.map(item => item.projectName)
  const budgetSeries = budgetDataset.value.map(item => item.budget)
  const actualSeries = budgetDataset.value.map(item => item.actual)

  budgetChart.setOption({
    color: ['#5b8ff9', '#5ad8a6'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const lines = [params[0]?.axisValue || '']
        params.forEach(item => {
          lines.push(`${item.marker}${item.seriesName}：${formatMoney(item.value)}`)
        })
        return lines.join('<br/>')
      }
    },
    legend: {
      top: 8,
      textStyle: { color: '#606266' }
    },
    grid: {
      left: 18,
      right: 16,
      top: 48,
      bottom: 18,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLabel: {
        color: '#606266',
        interval: 0,
        formatter: value => (value.length > 8 ? `${value.slice(0, 8)}...` : value)
      },
      data: categories
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#909399',
        formatter: value => formatMoneyShort(value)
      },
      splitLine: {
        lineStyle: { color: '#eef2f8' }
      }
    },
    series: [
      {
        name: '项目预算',
        type: 'bar',
        barMaxWidth: 24,
        data: budgetSeries
      },
      {
        name: '实际花销',
        type: 'bar',
        barMaxWidth: 24,
        data: actualSeries
      }
    ]
  })
}

const resizeBudgetChart = () => {
  budgetChart?.resize()
}

const disposeBudgetChart = () => {
  if (budgetChart) {
    budgetChart.dispose()
    budgetChart = null
  }
}

const loadStats = async () => {
  loading.value = true
  chartLoading.value = true
  try {
    const res = await getProjectOverview()
    const overview = res.data || {}
    stats.value = buildStats(overview)
    budgetDataset.value = buildCostDatasetFromOverview(overview)
    await nextTick()
    if (budgetDataset.value.length > 0) {
      renderBudgetChart()
      resizeBudgetChart()
    } else {
      disposeBudgetChart()
    }
  } catch (error) {
    console.error('加载项目数据失败:', error)
    stats.value = buildStats()
    budgetDataset.value = []
    disposeBudgetChart()
  } finally {
    loading.value = false
    chartLoading.value = false
  }
}

const loadTodo = async () => {
  todoLoading.value = true
  try {
    const res = await getTodoOverview()
    const todo = buildTodo(res.data || {})
    todoSummary.value = todo.summary
    submitStageTodos.value = todo.submitList
    submitStageCount.value = todo.submitStageCount
  } catch (error) {
    console.error('加载待办事项失败:', error)
    const todo = buildTodo()
    todoSummary.value = todo.summary
    submitStageTodos.value = todo.submitList
    submitStageCount.value = todo.submitStageCount
  } finally {
    todoLoading.value = false
  }
}

const goTodo = (routePath) => {
  if (!routePath) return
  router.push(routePath)
}

const goSubmitStage = (item) => {
  if (item?.projectId) {
    router.push(`/project/process/${item.projectId}`)
    return
  }
  router.push('/project/list')
}

onMounted(() => {
  loadStats()
  loadTodo()
  window.addEventListener('resize', resizeBudgetChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeBudgetChart)
  disposeBudgetChart()
})
</script>

<template>
  <div class="dashboard-container">
    <div class="page-head">
      <h1 class="page-title">数据概览</h1>
      <p class="page-subtitle">项目预算与实际花销一览，关键待办快速处理</p>
    </div>

    <div class="stat-cards" v-loading="loading">
      <StatCard
        v-for="(stat, index) in stats"
        :key="index"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :bg-color="stat.color"
      />
    </div>

    <div class="dashboard-main">
      <el-card class="panel chart-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span>项目预算 vs 实际花销</span>
            <span class="header-tag">Top 8 项目</span>
          </div>
        </template>
        <div class="chart-wrapper" v-loading="chartLoading">
          <div v-if="budgetDataset.length > 0" ref="budgetChartRef" class="budget-chart"></div>
          <el-empty v-else description="暂无预算/花销数据" :image-size="92" />
        </div>
      </el-card>

      <el-card class="panel todo-panel" shadow="never">
        <template #header>
          <div class="card-header">
            <span>待办事项</span>
          </div>
        </template>
        <div v-loading="todoLoading">
          <div class="todo-summary">
            <div class="todo-summary-item" v-for="item in visibleTodoSummary" :key="item.key">
              <div class="todo-summary-main">
                <span class="todo-summary-title">{{ item.title }}</span>
                <span class="todo-summary-count">{{ item.count }}</span>
              </div>
              <el-button type="primary" link @click="goTodo(item.route)">
                {{ item.actionText }}
              </el-button>
            </div>
          </div>

          <template v-if="!isAdminRole">
            <el-divider content-position="left">应提交流程阶段</el-divider>

            <div v-if="submitStageTodos.length > 0" class="submit-stage-list">
              <div class="submit-stage-item" v-for="(item, index) in submitStageTodos" :key="`${item.projectId}-${index}`">
                <div class="submit-stage-content">
                  <div class="submit-stage-project">{{ item.projectName }}</div>
                  <div class="submit-stage-name">应提交阶段：{{ item.stage }}</div>
                </div>
                <el-button type="primary" link @click="goSubmitStage(item)">去提交</el-button>
              </div>
            </div>

            <el-alert
              v-else-if="submitStageCount > 0"
              title="存在待提交阶段，请进入项目流程查看具体阶段。"
              type="warning"
              :closable="false"
              show-icon
            />

            <el-empty v-else description="暂无待提交阶段" :image-size="70" />
          </template>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100%;
  padding: 22px;
  background: linear-gradient(180deg, #f4f9ff 0%, #f6f8fb 180px, #f6f8fb 100%);
}

.page-head {
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0.5px;
  color: #1f2d3d;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #7a8699;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.dashboard-main {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(340px, 1fr);
  gap: 16px;
  align-items: start;
}

.panel {
  border: 1px solid #e7edf5;
  border-radius: 14px;
  background: #ffffffd9;
  backdrop-filter: blur(2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #2d3a4b;
}

.header-tag {
  font-size: 12px;
  color: #5b8ff9;
  background: #ecf3ff;
  border: 1px solid #dbe8ff;
  border-radius: 12px;
  padding: 2px 10px;
}

.chart-wrapper {
  min-height: 380px;
}

.budget-chart {
  height: 360px;
  width: 100%;
}

.todo-summary {
  display: grid;
  gap: 8px;
}

.todo-summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e8edf7;
  border-radius: 10px;
  background: linear-gradient(120deg, #ffffff 0%, #f8fbff 100%);
}

.todo-summary-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-summary-title {
  color: #303133;
}

.todo-summary-count {
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  padding: 0 8px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #4f8bff 0%, #2d6df6 100%);
}

.submit-stage-list {
  display: grid;
  gap: 8px;
}

.submit-stage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: #f8faff;
  border: 1px solid #e7efff;
}

.submit-stage-project {
  font-size: 14px;
  color: #303133;
}

.submit-stage-name {
  margin-top: 2px;
  font-size: 12px;
  color: #606266;
}

@media (max-width: 1200px) {
  .dashboard-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 14px;
  }

  .page-title {
    font-size: 22px;
  }

  .budget-chart {
    height: 320px;
  }
}
</style>
