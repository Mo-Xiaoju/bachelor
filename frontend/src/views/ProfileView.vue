<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { buildURL } from '../utils/api'

const user = ref<any>(null)
const loading = ref(true)
const activeMenu = ref('个人信息')
const isEditing = ref(false)
const loadingLogs = ref(false)
const applicationLogs = ref<any[]>([])

// 翻页相关
const currentPage = ref(1)
const pageSize = ref(1)
const totalPages = ref(1)

// 筛选相关
const searchKeyword = ref('')
const selectedTypes = ref<string[]>([])
const selectedStatuses = ref<string[]>([])

const typeOptions = [
  { value: 'internship', label: '实习申请' },
  { value: 'train', label: '科研训练申请' },
  { value: 'double-selection', label: '双选申请' },
  { value: 'team', label: '团队组建申请' },
  { value: 'company', label: '企业注册申请' },
  { value: 'project', label: '课题申请' }
]

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'completed', label: '已完成' }
]

const menuItems = ref([
  { name: '个人信息', path: 'profile' },
  { name: '我的信息', path: 'my-info' }
])

const editForm = ref({
  contact: '',
  email: '',
})

const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')
  console.log('Navbar - 获取 Token:', token ? '存在' : '不存在')
  return token
}

const checkAuth = async () => {
  const token = getToken()
  try {
    const response = await fetch(buildURL('/api/check-auth'), {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()

    if (result.success) {
      user.value = result.user
    } else {
      window.location.href = '/login'
    }
  } catch (error) {
    window.location.href = '/login'
  } finally {
    loading.value = false
  }
}

const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
  console.log('点击菜单:', item.name, '路径:', item.path)
  if (item.name === '我的信息') {
    getApplicationLogs()
  }
}

const getApplicationLogs = async (page: number = 1) => {
  loadingLogs.value = true
  currentPage.value = page
  try {
    const token = sessionStorage.getItem('token')
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.value.toString())

    if (searchKeyword.value) {
      params.append('keyword', searchKeyword.value)
    }

    if (selectedTypes.value.length > 0) {
      params.append('types', selectedTypes.value.join(','))
    }

    if (selectedStatuses.value.length > 0) {
      params.append('statuses', selectedStatuses.value.join(','))
    }

    const response = await fetch(buildURL('/api/user/application-logs?' + params.toString()), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        applicationLogs.value = result.logs
        totalPages.value = result.total_pages || 1
      }
    }
  } catch (error) {
    console.error('获取申请日志失败', error)
  } finally {
    loadingLogs.value = false
  }
}

const toggleTypeFilter = (type: string) => {
  const index = selectedTypes.value.indexOf(type)
  if (index > -1) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(type)
  }
  getApplicationLogs(1)
}

const toggleStatusFilter = (status: string) => {
  const index = selectedStatuses.value.indexOf(status)
  if (index > -1) {
    selectedStatuses.value.splice(index, 1)
  } else {
    selectedStatuses.value.push(status)
  }
  getApplicationLogs(1)
}

const handleSearch = () => {
  getApplicationLogs(1)
}

const clearFilters = () => {
  searchKeyword.value = ''
  selectedTypes.value = []
  selectedStatuses.value = []
  getApplicationLogs(1)
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'internship': '实习申请',
    'train': '科研训练申请',
    'double-selection': '双选申请',
    'team': '团队组建申请',
    'company': '企业注册申请',
    'project': '课题申请'
  }
  return labels[type] || type
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pending': '待处理',
    'approved': '已批准',
    'rejected': '已拒绝',
    'completed': '已完成'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'rejected': 'status-rejected',
    'completed': 'status-completed'
  }
  return classes[status] || ''
}

const editContactInfo = () => {
  editForm.value.contact = user.value?.contact || ''
  editForm.value.email = user.value?.email || ''
  isEditing.value = true
}

const saveContactInfo = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/user/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(editForm.value),
    })
    const result = await response.json()
    if (result.success) {
      user.value.contact = editForm.value.contact
      user.value.email = editForm.value.email
      isEditing.value = false
      alert('联系方式保存成功')
    } else {
      alert('保存失败: ' + result.message)
    }
  } catch (error) {
    console.error('保存联系方式失败', error)
    alert('网络错误，请稍后重试')
  }
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.profile-view {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 内容容器 */
.profile-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.title-section h1 {
  color: #2c3e50;
  font-size: 32px;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.title-section h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* 主要内容区域：1-2布局 */
.main-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

/* 左侧：标签栏 */
.left-panel {
  width: 250px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.menu-section {
  margin-bottom: 25px;
}

.menu-title {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-left: 15px;
  border-left: 4px solid #667eea;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(5px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

/* 右侧：内容区域 */
.right-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

/* 个人信息 */
.profile-content {
  animation: fadeIn 0.5s ease;
}

.profile-card {
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.profile-card h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.user-details p {
  margin: 15px 0;
  font-size: 15px;
  color: #34495e;
  line-height: 1.6;
}

.user-details p strong {
  color: #2c3e50;
  width: 100px;
  display: inline-block;
}

.contact-info {
  margin-bottom: 20px;
}

.contact-info p {
  margin: 15px 0;
  font-size: 15px;
  color: #34495e;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-info p strong {
  color: #2c3e50;
  width: 100px;
  display: inline-block;
}

.edit-section {
  margin-top: 25px;
  text-align: center;
}

.edit-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.edit-form {
  margin-top: 25px;
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.edit-form h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-item input {
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-item input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.save-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.cancel-btn {
  padding: 10px 30px;
  background: #f8f9ff;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8ebff;
  border-color: #667eea;
  color: #667eea;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 我的信息样式 */
.my-info-content {
  animation: fadeIn 0.5s ease;
}

.info-card {
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.info-card h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.log-item {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #667eea;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.log-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.log-type.internship {
  background: #e3f2fd;
  color: #1976d2;
}

.log-type.train {
  background: #f3e5f5;
  color: #7b1fa2;
}

.log-type.double-selection {
  background: #e8f5e9;
  color: #388e3c;
}

.log-type.team {
  background: #fff3e0;
  color: #f57c00;
}

.log-type.company {
  background: #fce4ec;
  color: #c2185b;
}

.log-type.project {
  background: #e0f2f1;
  color: #00897b;
}

.log-time {
  font-size: 12px;
  color: #999;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-row {
  display: flex;
  align-items: flex-start;
}

.log-label {
  font-weight: 600;
  color: #555;
  width: 100px;
  flex-shrink: 0;
}

.log-value {
  color: #333;
}

.status-pending {
  color: #ff9800;
  font-weight: 500;
}

.status-approved {
  color: #4caf50;
  font-weight: 500;
}

.status-rejected {
  color: #f44336;
  font-weight: 500;
}

.status-completed {
  color: #2196f3;
  font-weight: 500;
}

/* 筛选区域样式 */
.filter-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-box input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #5a6fd6;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: #555;
  min-width: 80px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.filter-checkbox input {
  cursor: pointer;
}

.clear-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #eee;
  border-color: #ccc;
}

/* 翻页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #5a6fd6;
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

</style>

<template>
  <div class="profile-view">
    <div class="profile-container">
      <!-- 标题区域 -->
      <div class="title-section">
        <h1>个人信息</h1>
      </div>



      <!-- 主要内容区域：1-2布局 -->
      <div class="main-content">
        <!-- 左侧：标签栏 -->
        <div class="left-panel">
          <div class="menu-section">
            <h3 class="menu-title">个人设置</h3>
            <div
              v-for="item in menuItems"
              :key="item.name"
              class="menu-item"
              :class="{ active: activeMenu === item.name }"
              @click="handleMenuClick(item)"
            >
              <span class="menu-text">{{ item.name }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：内容区域 -->
        <div class="right-panel">
          <!-- 个人信息 -->
          <div v-if="activeMenu === '个人信息'" class="profile-content">
            <div class="profile-card">
              <h3>用户信息</h3>
              <div class="user-details">
                <p><strong>用户名：</strong>{{ user?.username }}</p>
                <p><strong>真实姓名：</strong>{{ user?.realname }}</p>
                <p><strong>专业：</strong>{{ user?.major || '未设置' }}</p>
                <p><strong>院系：</strong>{{ user?.department || '未设置' }}</p>
                <div class="contact-info">
                  <p><strong>联系电话：</strong>{{ user?.contact || '未设置' }}</p>
                  <p><strong>电子邮箱：</strong>{{ user?.email || '未设置' }}</p>
                </div>
              </div>
              <div class="edit-section">
                <button class="edit-btn" @click="editContactInfo">编辑联系方式</button>
              </div>
            </div>

            <!-- 编辑表单 -->
            <div v-if="isEditing" class="edit-form">
              <h3>编辑联系方式</h3>
              <div class="form-row">
                <div class="form-item">
                  <label>联系电话：</label>
                  <input type="tel" v-model="editForm.contact" placeholder="请输入联系电话" />
                </div>
                <div class="form-item">
                  <label>电子邮箱：</label>
                  <input type="email" v-model="editForm.email" placeholder="请输入电子邮箱" />
                </div>
              </div>
              <div class="form-actions">
                <button class="save-btn" @click="saveContactInfo">保存</button>
                <button class="cancel-btn" @click="isEditing = false">取消</button>
              </div>
            </div>
          </div>

          <!-- 我的信息 -->
          <div v-if="activeMenu === '我的信息'" class="my-info-content">
            <div class="info-card">
              <h3>申请日志</h3>

              <!-- 搜索和筛选区域 -->
              <div class="filter-section">
                <div class="search-box">
                  <input
                    type="text"
                    v-model="searchKeyword"
                    placeholder="搜索申请记录..."
                    @keyup.enter="handleSearch"
                  />
                  <button class="search-btn" @click="handleSearch">搜索</button>
                </div>

                <!-- 类型筛选 -->
                <div class="filter-group">
                  <span class="filter-label">申请类型：</span>
                  <label v-for="option in typeOptions" :key="option.value" class="filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedTypes.includes(option.value)"
                      @change="toggleTypeFilter(option.value)"
                    />
                    {{ option.label }}
                  </label>
                </div>

                <!-- 状态筛选 -->
                <div class="filter-group">
                  <span class="filter-label">申请状态：</span>
                  <label v-for="option in statusOptions" :key="option.value" class="filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedStatuses.includes(option.value)"
                      @change="toggleStatusFilter(option.value)"
                    />
                    {{ option.label }}
                  </label>
                </div>

                <button class="clear-btn" @click="clearFilters">清除筛选</button>
              </div>

              <div v-if="loadingLogs" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
              </div>
              <div v-else-if="applicationLogs.length === 0" class="empty-state">
                <p>暂无申请记录</p>
              </div>
              <div v-else class="logs-list">
                <div v-for="log in applicationLogs" :key="log.id" class="log-item">
                  <div class="log-header">
                    <span class="log-type" :class="log.type.toLowerCase()">{{ getTypeLabel(log.type) }}</span>
                    <span class="log-time">{{ log.create_time }}</span>
                  </div>
                  <div class="log-content">
                    <div class="log-row">
                      <span class="log-label">申请结果：</span>
                      <span class="log-value" :class="getStatusClass(log.status)">{{ getStatusLabel(log.status) }}</span>
                    </div>
                    <div class="log-row">
                      <span class="log-label">处理人：</span>
                      <span class="log-value">{{ log.handler_name || '系统' }}</span>
                    </div>
                    <div class="log-row">
                      <span class="log-label">回执信息：</span>
                      <span class="log-value">{{ log.receipt || '-' }}</span>
                    </div>
                    <div v-if="log.description" class="log-row">
                      <span class="log-label">详情：</span>
                      <span class="log-value">{{ log.description }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 翻页区域 -->
              <div v-if="totalPages > 1" class="pagination">
                <button
                  class="page-btn"
                  :disabled="currentPage === 1"
                  @click="getApplicationLogs(currentPage - 1)"
                >
                  上一页
                </button>
                <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
                <button
                  class="page-btn"
                  :disabled="currentPage === totalPages"
                  @click="getApplicationLogs(currentPage + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
