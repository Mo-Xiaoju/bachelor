<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)


const getToken = () => {
  return sessionStorage ? sessionStorage.getItem('token') : ''
}

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

    // 检查是否是教师用户，如果不是则重定向到首页
    if (storedUser.role !== 'teacher') {
      router.push('/')
    }
    return
  }

  // 如果没有，尝试从后端验证
  const token = sessionStorage.getItem('token')
  if (!token) {
    loading.value = false
    router.push('/')
    return
  }

  try {
    const response = await fetch(buildURL('/api/check-auth'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()

    if (result.success) {
      user.value = result.user
      sessionStorage.setItem('user', JSON.stringify(result.user))

      // 检查是否是教师用户，如果不是则重定向到首页
      if (result.user.role !== 'teacher') {
        router.push('/')
      }
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 任务分配相关
const students = ref<any[]>([])
const selectedStudentId = ref(null)
const studentLogs = ref<any[]>([])
const loadingStudents = ref(false)
const loadingStudentLogs = ref(false)

// 获取教师的学生列表
const getStudents = async () => {
  if (user.value?.role !== 'teacher') return
  loadingStudents.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/teacher/students'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      students.value = result.students
    }
  } catch (error) {
    console.error('获取学生列表失败', error)
  } finally {
    loadingStudents.value = false
  }
}

// 获取学生的日志列表
const getStudentLogs = async (studentId) => {
  if (user.value?.role !== 'teacher') return
  loadingStudentLogs.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/teacher/student-logs/${studentId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      studentLogs.value = result.logs
    }
  } catch (error) {
    console.error('获取学生日志失败', error)
  } finally {
    loadingStudentLogs.value = false
  }
}

// 选择学生查看日志
const selectStudent = (studentId) => {
  selectedStudentId.value = studentId
  getStudentLogs(studentId)
}

onMounted(async () => {
  await checkAuth()
  // 获取教师的学生列表
  if (user.value?.role === 'teacher') {
    getStudents()
  }
})
</script>

<template>
  <div class="task-assignment-view">
    <div class="task-assignment-container">
      <h2>任务分配</h2>
      <div class="task-container">
        <!-- 左侧学生列表 -->
        <div class="student-list">
          <h3>我的学生</h3>
          <div v-if="loadingStudents" class="loading-cell">
            <p>加载中...</p>
          </div>
          <div v-else-if="students.length === 0" class="empty-cell">
            <p>暂无学生</p>
          </div>
          <div v-else class="students">
            <div
              v-for="student in students"
              :key="student.id"
              class="student-item"
              :class="{ active: selectedStudentId === student.id }"
              @click="selectStudent(student.id)"
            >
              {{ student.name }}
            </div>
          </div>
        </div>

        <!-- 右侧日志列表 -->
        <div class="student-logs">
          <h3 v-if="selectedStudentId">
            {{ students.find(s => s.id === selectedStudentId)?.name }}的工作日志
          </h3>
          <h3 v-else>选择学生查看日志</h3>

          <div v-if="loadingStudentLogs" class="loading-cell">
            <p>加载中...</p>
          </div>
          <div v-else-if="!selectedStudentId" class="empty-cell">
            <p>请选择一个学生查看其工作日志</p>
          </div>
          <div v-else-if="studentLogs.length === 0" class="empty-cell">
            <p>该学生暂无工作日志</p>
          </div>
          <div v-else class="logs">
            <div v-for="log in studentLogs" :key="log.id" class="log-item">
              <div class="log-date">{{ log.date }}</div>
              <div class="log-content">{{ log.content }}</div>
              <div v-if="log.file" class="log-file">
                <a :href="`${buildURL(`/api/student/logs/file/${log.file}`)}?token=${getToken()}`" target="_blank">查看附件</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.task-assignment-view {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 30px;
  box-sizing: border-box;
  margin-top: 60px; /* 为上方导航栏留出空间 */
}

.task-assignment-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 1200px;
  margin: 0 auto;
}

.task-assignment-container h2 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 30px 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
  text-align: center;
}

.task-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
}

/* 左侧学生列表 */
.student-list {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.student-list h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.students {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.student-item {
  padding: 15px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  border: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 500;
}

.student-item:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: translateX(5px);
}

.student-item.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

/* 右侧日志列表 */
.student-logs {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.student-logs h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.logs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.log-item {
  background: white;
  border-radius: 10px;
  padding: 20px;
  border-left: 4px solid #2196f3;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.log-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.log-date {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
}

.log-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-file {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e6e6e6;
}

.log-file a {
  color: #2196f3;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.log-file a:hover {
  color: #1976d2;
  text-decoration: underline;
}

/* 加载和空状态 */
.loading-cell,
.empty-cell {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-cell p,
.empty-cell p {
  font-size: 16px;
  color: #999;
  margin: 0;
}

/* 滚动条样式 */
.students::-webkit-scrollbar,
.logs::-webkit-scrollbar {
  width: 6px;
}

.students::-webkit-scrollbar-track,
.logs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.students::-webkit-scrollbar-thumb,
.logs::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.students::-webkit-scrollbar-thumb:hover,
.logs::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-assignment-view {
    padding: 20px 15px;
  }

  .task-assignment-container {
    padding: 20px;
  }

  .task-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .student-list,
  .student-logs {
    padding: 20px;
  }

  .students,
  .logs {
    max-height: 300px;
  }
}
</style>
