<template>
  <transition name="slide-up">
    <div v-if="show" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-panel">
        <div class="drawer-header">
          <div class="drawer-handle"></div>
          <h3>📊 数据统计</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
        <div class="drawer-body">
          <div v-if="loading" class="loading-cell">
            <p>加载中...</p>
          </div>
          <div v-else class="statistics-layout">
            <!-- 左侧标签栏 -->
            <div class="left-panel">
              <div class="menu-section">
                <h3 class="menu-title">概览数据</h3>
                <div
                  class="menu-item"
                  :class="{ active: activeTab === 'overview' }"
                  @click="activeTab = 'overview'"
                >
                  <span class="menu-text">数据总览</span>
                </div>
                <div
                  class="menu-item"
                  :class="{ active: activeTab === 'analysis' }"
                  @click="activeTab = 'analysis'"
                >
                  <span class="menu-text">投递分析</span>
                </div>
              </div>

              <div class="menu-section">
                <h3 class="menu-title">分布统计</h3>
                <div
                  class="menu-item"
                  :class="{ active: activeTab === 'major' }"
                  @click="activeTab = 'major'"
                >
                  <span class="menu-text">专业分布</span>
                </div>
                <div
                  class="menu-item"
                  :class="{ active: activeTab === 'department' }"
                  @click="activeTab = 'department'"
                >
                  <span class="menu-text">院系分布</span>
                </div>
              </div>

              <div class="menu-section">
                <h3 class="menu-title">岗位统计</h3>
                <div
                  class="menu-item"
                  :class="{ active: activeTab === 'positions' }"
                  @click="activeTab = 'positions'"
                >
                  <span class="menu-text">岗位投递</span>
                </div>
              </div>
            </div>

            <!-- 右侧内容区域 -->
            <div class="right-panel">
              <!-- 数据总览 -->
              <div v-if="activeTab === 'overview'" class="content-section">
                <h2>数据总览</h2>
                <div class="stats-overview">
                  <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                      <div class="stat-value">{{ data.totalApplicants }}</div>
                      <div class="stat-label">总简历投递人数</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">📄</div>
                    <div class="stat-info">
                      <div class="stat-value">{{ data.totalResumes }}</div>
                      <div class="stat-label">投递简历份数</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                      <div class="stat-value">{{ data.totalFavorites }}</div>
                      <div class="stat-label">岗位收藏量</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 投递分析 -->
              <div v-if="activeTab === 'analysis'" class="content-section">
                <h2>投递分析</h2>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-label">人均投递岗位数</div>
                    <div class="stat-value">{{ data.avgApplicationsPerStudent }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">重复投递率</div>
                    <div class="stat-value">{{ data.duplicateApplicationRate }}%</div>
                  </div>
                </div>
              </div>

              <!-- 专业分布 -->
              <div v-if="activeTab === 'major'" class="content-section">
                <h2>各专业投递分布</h2>
                <div class="chart-container">
                  <div v-for="item in data.majorDistribution" :key="item.major" class="bar-item">
                    <div class="bar-label">{{ item.major }}</div>
                    <div class="bar-wrapper">
                      <div class="bar" :style="{ width: item.percentage + '%' }">
                        <span class="bar-value">{{ item.count }} ({{ item.percentage }}%)</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="data.majorDistribution.length === 0" class="empty-data">
                    暂无数据
                  </div>
                </div>
              </div>

              <!-- 院系分布 -->
              <div v-if="activeTab === 'department'" class="content-section">
                <h2>各院系投递分布</h2>
                <div class="chart-container">
                  <div v-for="item in data.departmentDistribution" :key="item.department" class="bar-item">
                    <div class="bar-label">{{ item.department }}</div>
                    <div class="bar-wrapper">
                      <div class="bar" :style="{ width: item.percentage + '%' }">
                        <span class="bar-value">{{ item.count }} ({{ item.percentage }}%)</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="data.departmentDistribution.length === 0" class="empty-data">
                    暂无数据
                  </div>
                </div>
              </div>

              <!-- 岗位投递 -->
              <div v-if="activeTab === 'positions'" class="content-section">
                <h2>各岗位投递统计</h2>
                <div class="chart-container">
                  <div v-for="item in data.internshipStats" :key="item.position" class="bar-item">
                    <div class="bar-label">{{ item.position }}</div>
                    <div class="bar-wrapper">
                      <div class="bar" :style="{ width: item.percentage + '%' }">
                        <span class="bar-value">{{ item.applications }}人投递, {{ item.favorites }}收藏</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="data.internshipStats.length === 0" class="empty-data">
                    暂无数据
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { buildURL } from '../utils/api'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const activeTab = ref('overview')

const data = ref<any>({
  totalApplicants: 0,
  totalResumes: 0,
  avgApplicationsPerStudent: 0,
  duplicateApplicationRate: 0,
  totalFavorites: 0,
  majorDistribution: [],
  departmentDistribution: [],
  internshipStats: [],
})

const loading = ref(false)

const loadStatistics = async () => {
  loading.value = true
  activeTab.value = 'overview'
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/company/statistics'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      data.value = result.statistics
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  } finally {
    loading.value = false
  }
}

defineExpose({ loadStatistics })
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.drawer-panel {
  width: 100%;
  height: 85vh;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  position: relative;
  background: #ffffff;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.drawer-handle {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.drawer-header h3 {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.drawer-body {
  flex: 1;
  overflow: hidden;
}

.statistics-layout {
  display: flex;
  height: 100%;
}

.left-panel {
  width: 220px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 20px 0;
  overflow-y: auto;
  flex-shrink: 0;
}

.menu-section {
  margin-bottom: 24px;
}

.menu-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  padding: 0 20px;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.active {
  background: #ffffff;
  border-left-color: #667eea;
  color: #667eea;
  font-weight: 600;
}

.menu-text {
  font-size: 14px;
  color: #374151;
}

.menu-item.active .menu-text {
  color: #667eea;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.content-section {
  max-width: 900px;
}

.content-section h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #667eea;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 36px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-item .stat-label {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-item .stat-value {
  color: #667eea;
  font-size: 32px;
  font-weight: 700;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bar-label {
  min-width: 100px;
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.bar-wrapper {
  flex: 1;
  background: #f3f4f6;
  border-radius: 6px;
  height: 32px;
  overflow: hidden;
}

.bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  border-radius: 6px;
  transition: width 0.5s ease;
  min-width: 80px;
}

.bar-value {
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 14px;
}

.loading-cell {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
