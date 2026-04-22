<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)
const confirmedStudents = ref<any[]>([])
const loadingStudents = ref(false)
const errorMessage = ref('')

// 从 sessionStorage 获取用户信息
const getStoredUser = (): any => {
  const userStr = sessionStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

const checkAuth = async () => {
  // 首先尝试从 sessionStorage 读取
  const storedUser = getStoredUser()
  if (storedUser) {
    user.value = storedUser
    loading.value = false
    return
  }

  // 如果没有，尝试从后端验证
  const token = sessionStorage.getItem('token')
  if (!token) {
    loading.value = false
    return
  }

  try {
    const response = await fetch('http://localhost:5000/api/check-auth', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()

    if (result.success) {
      user.value = result.user
      sessionStorage.setItem('user', JSON.stringify(result.user))
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  } finally {
    loading.value = false
  }
}

// 获取已确认的实习生列表
const getConfirmedStudents = async () => {
  loadingStudents.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/confirmed-students', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      confirmedStudents.value = result.students
    } else {
      errorMessage.value = result.message || '获取学生列表失败'
    }
  } catch (error) {
    console.error('获取学生列表失败', error)
    errorMessage.value = '获取学生列表失败，请稍后重试'
  } finally {
    loadingStudents.value = false
  }
}

// 查看简历
const viewResume = async (resumeFile: string) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(
      `http://localhost:5000/api/internship/resume/${resumeFile}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      },
    )

    if (response.ok) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } else {
      const result = await response.json()
      errorMessage.value = result.message || '查看简历失败'
    }
  } catch (error) {
    console.error('查看简历失败', error)
    errorMessage.value = '查看简历失败，请稍后重试'
  }
}

onMounted(async () => {
  await checkAuth()
  // 检查用户角色，确保只有企业用户访问
  if (user.value?.role !== 'company') {
    router.push('/')
    return
  }
  // 获取已确认的实习生列表
  await getConfirmedStudents()
})
</script>

<template>
  <div class="company-student-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>学生管理</h1>
      <p class="page-subtitle">已确认的实习生列表</p>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 错误消息提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- 学生列表 -->
      <div class="student-list-section">
        <div v-if="loadingStudents" class="loading-container">
          <p>加载中...</p>
        </div>
        <div v-else>
          <table class="student-table">
            <thead>
              <tr>
                <th>学生姓名</th>
                <th>学号</th>
                <th>专业</th>
                <th>实习岗位</th>
                <th>确认时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in confirmedStudents" :key="student.id">
                <td>{{ student.student_name }}</td>
                <td>{{ student.student_id }}</td>
                <td>{{ student.major || '未设置' }}</td>
                <td>{{ student.position }}</td>
                <td>{{ student.confirm_time }}</td>
                <td class="operation">
                  <a v-if="student.resume_file" href="#" @click.prevent="viewResume(student.resume_file)">查看简历</a>
                </td>
              </tr>
              <tr v-if="confirmedStudents.length === 0">
                <td colspan="6" class="empty-cell">暂无已确认的实习生</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.company-student-view {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  margin-top: 60px; /* 为上方导航栏留出空间 */
  position: relative;
  left: 0;
  right: 0;
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  transition: color 0.3s ease;
}

.page-subtitle {
  color: #666;
  font-size: 16px;
  margin: 10px 0 0 0;
  font-weight: 500;
  transition: all 0.3s ease;
}

.main-content {
  flex: 1;
  padding: 40px 30px;
  box-sizing: border-box;
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  border-left: 4px solid #f44336;
  color: #f44336;
  padding: 15px 20px;
  margin-bottom: 30px;
  border-radius: 4px;
  font-size: 14px;
}

.student-list-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.student-list-section:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.loading-container {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.student-table th,
.student-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.student-table th {
  background-color: #f8f9ff;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.student-table tr:hover {
  background-color: #f5f5f5;
}

.operation {
  display: flex;
  gap: 10px;
}

.operation a {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.operation a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.empty-cell {
  text-align: center;
  padding: 60px 0;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 15px;
  }

  .student-list-section {
    padding: 20px;
  }

  .student-table th,
  .student-table td {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>
