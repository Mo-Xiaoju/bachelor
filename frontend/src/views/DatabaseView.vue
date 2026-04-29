<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { buildURL } from '../utils/api'

const loading = ref(true)
const activeTable = ref('user')
const currentPage = ref(1)
const totalPages = ref(1)
const currentData = ref<any[]>([])
const currentColumns = ref<string[]>([])

const stats = ref({
  totalUsers: 0,
  students: 0,
  teachers: 0,
  companies: 0
})

const tables = [
  { name: 'user', label: '用户表' },
  { name: 'company', label: '企业表' },
  { name: 'internship', label: '实习表' },
  { name: 'internship_application', label: '实习申请表' },
  { name: 'team', label: '团队表' },
  { name: 'team_member', label: '团队成员表' },
  { name: 'teacher_selection', label: '导师双选表' },
  { name: 'double_selection_teacher', label: '双选导师表' },
  { name: 'double_selection_student', label: '双选学生表' },
  { name: 'train_project', label: '科研训练表' },
  { name: 'train_application', label: '训练申请表' },
  { name: 'train_report', label: '训练报告表' },
  { name: 'application_log', label: '申请日志表' }
]

const selectTable = async (tableName: string) => {
  activeTable.value = tableName
  currentPage.value = 1
  await fetchData()
}

const changePage = async (page: number) => {
  currentPage.value = page
  await fetchData()
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const fetchData = async () => {
  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/database/table/${activeTable.value}?page=${currentPage.value}&size=20`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const result = await response.json()
    if (result.success) {
      currentData.value = result.data
      currentColumns.value = result.columns
      totalPages.value = result.total_pages
    }
  } catch (error) {
    console.error('获取数据失败', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/database/stats'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const result = await response.json()
    if (result.success) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

onMounted(async () => {
  await fetchStats()
  await fetchData()
})
</script>

<template>
  <div class="database-view">
    <!-- 标题区域 -->
    <div class="title-section">
      <h1>数据库面板</h1>
      <p class="subtitle">查看数据库中的所有记录</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎓</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.students }}</div>
          <div class="stat-label">学生数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.teachers }}</div>
          <div class="stat-label">教师数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.companies }}</div>
          <div class="stat-label">企业数</div>
        </div>
      </div>
    </div>

    <!-- 数据表选择 -->
    <div class="table-selector">
      <h3>选择数据表</h3>
      <div class="table-buttons">
        <button
          v-for="table in tables"
          :key="table.name"
          class="table-btn"
          :class="{ active: activeTable === table.name }"
          @click="selectTable(table.name)"
        >
          {{ table.label }}
        </button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>
      <div v-else-if="currentData.length === 0" class="empty-state">
        <p>该表暂无数据</p>
      </div>
      <div v-else>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="column in currentColumns" :key="column">{{ column }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in currentData" :key="index">
                <td v-for="column in currentColumns" :key="column">
                  {{ formatValue(row[column]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="totalPages > 1">
          <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.database-view {
  padding: 80px 30px 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  margin-bottom: 30px;
}

.title-section h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.table-selector {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.table-selector h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.table-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-btn {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.table-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.table-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th, .data-table td {
  border: 1px solid #e8e8e8;
  padding: 10px;
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tr:hover {
  background: #fafafa;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}
</style>
