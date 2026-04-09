<template>
  <div class="stat-card card-shadow">
    <div class="stat-header">
      <div class="stat-icon" :style="{ backgroundColor: bgColor }">
        <el-icon size="24" color="#fff"><component :is="icon" /></el-icon>
      </div>
      <div class="stat-title">{{ title }}</div>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-footer">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  bgColor: {
    type: String,
    default: '#9b59b6'
  }
})
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.2);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-title {
  font-size: 14px;
  color: #7f8c8d;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}

.stat-footer {
  font-size: 12px;
  color: #95a5a6;
}
</style>
