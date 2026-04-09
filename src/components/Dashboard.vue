<template>
  <div class="page-container">
    <Header />
    <div style="display: flex;">
      <Sidebar />
      <div class="content" style="flex: 1; padding: 20px;">
        <h2 style="margin-bottom: 20px; color: #2c3e50;">工作台</h2>

        <el-row :gutter="20">
          <el-col :span="6">
            <StatCard title="总项目数" value="12" icon="Document" bg-color="#9b59b6">
              较上月增长 15%
            </StatCard>
          </el-col>
          <el-col :span="6">
            <StatCard title="待审批" value="5" icon="Edit" bg-color="#f39c12">
              需要处理
            </StatCard>
          </el-col>
          <el-col :span="6">
            <StatCard title="总预算" value="¥580,000" icon="Money" bg-color="#27ae60">
              本年度累计
            </StatCard>
          </el-col>
          <el-col :span="6">
            <StatCard title="科研成果" value="28" icon="Trophy" bg-color="#3498db">
              较上年增长 20%
            </StatCard>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card class="card-shadow">
              <template #header>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: bold;">项目状态分布</span>
                </div>
              </template>
              <div ref="chartRef" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="card-shadow">
              <template #header>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: bold;">近期通知</span>
                </div>
              </template>
              <el-timeline>
                <el-timeline-item timestamp="2026-03-15" placement="top">
                  <el-card>
                    <h4>新项目申报开始</h4>
                    <p>请各部门做好项目申报准备工作</p>
                  </el-card>
                </el-timeline-item>
                <el-timeline-item timestamp="2026-03-10" placement="top">
                  <el-card>
                    <h4>财务报销系统更新</h4>
                    <p>报销流程优化，审批速度更快</p>
                  </el-card>
                </el-timeline-item>
                <el-timeline-item timestamp="2026-03-05" placement="top">
                  <el-card>
                    <h4>科研成果统计完成</h4>
                    <p>2025 年度科研成果统计工作已完成</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import StatCard from '@/components/StatCard.vue'
import * as echarts from 'echarts'

const chartRef = ref(null)

onMounted(() => {
  if (chartRef.value) {
    const myChart = echarts.init(chartRef.value)
    myChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center' },
      series: [
        {
          name: '项目状态',
          type: 'pie',
          radius: ['40%', '70%'],
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          data: [
            { value: 5, name: '进行中' },
            { value: 3, name: '待审批' },
            { value: 2, name: '已完成' },
            { value: 2, name: '筹备中' }
          ]
        }
      ]
    })
  }
})
</script>
