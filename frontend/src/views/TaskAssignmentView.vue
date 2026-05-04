<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)
const activeMenu = ref('taskAssignment')


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

    // 检查是否是教师或管理员用户
    if (storedUser.role !== 'teacher' && storedUser.role !== 'admin') {
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

      // 检查是否是教师或管理员用户
      if (result.user.role !== 'teacher' && result.user.role !== 'admin') {
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

// 搜索和筛选
const searchKeyword = ref('')
const startDate = ref('')
const endDate = ref('')

// 获取教师的学生列表
const getStudents = async () => {
  if (user.value?.role !== 'teacher') return
  loadingStudents.value = true
  try {
    const token = sessionStorage.getItem('token')
    const params = new URLSearchParams()
    if (searchKeyword.value) {
      params.append('keyword', searchKeyword.value)
    }
    const response = await fetch(buildURL('/api/teacher/students?' + params.toString()), {
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
    const params = new URLSearchParams()
    if (startDate.value) {
      params.append('start_date', startDate.value)
    }
    if (endDate.value) {
      params.append('end_date', endDate.value)
    }
    const response = await fetch(buildURL(`/api/teacher/student-logs/${studentId}?` + params.toString()), {
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

const handleSearch = () => {
  selectedStudentId.value = null
  studentLogs.value = []
  getStudents()
}

const handleDateFilter = () => {
  if (selectedStudentId.value) {
    getStudentLogs(selectedStudentId.value)
  }
}

const clearFilters = () => {
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
  handleSearch()
}

// 选择学生查看日志
const selectStudent = (studentId) => {
  selectedStudentId.value = studentId
  getStudentLogs(studentId)
}

// 考务管理相关
const exams = ref<any[]>([])
const loadingExams = ref(false)
const showExamForm = ref(false)
const editingExam = ref<any>(null)
const showAssignDialog = ref(false)
const selectedExam = ref<any>(null)
const teachers = ref<any[]>([])
const loadingTeachers = ref(false)
const selectedTeacherId = ref('')

const examForm = ref({
  exam_name: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  location: '',
  description: ''
})

const getExams = async () => {
  loadingExams.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/exam-arrangements'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      exams.value = result.exams
    }
  } catch (error) {
    console.error('获取考务安排失败', error)
  } finally {
    loadingExams.value = false
  }
}

const getTeachers = async () => {
  loadingTeachers.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/teachers/list'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      teachers.value = result.teachers
    }
  } catch (error) {
    console.error('获取教师列表失败', error)
  } finally {
    loadingTeachers.value = false
  }
}

const openExamForm = (exam?: any) => {
  if (exam) {
    editingExam.value = exam
    examForm.value = {
      exam_name: exam.exam_name,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      location: exam.location,
      description: exam.description || ''
    }
  } else {
    editingExam.value = null
    examForm.value = {
      exam_name: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      location: '',
      description: ''
    }
  }
  showExamForm.value = true
}

const submitExamForm = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const url = editingExam.value
      ? `/api/exam-arrangements/${editingExam.value.id}`
      : '/api/exam-arrangements'
    const method = editingExam.value ? 'PUT' : 'POST'

    const response = await fetch(buildURL(url), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(examForm.value)
    })

    const result = await response.json()
    if (result.success) {
      showExamForm.value = false
      getExams()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (error) {
    console.error('提交考务表单失败', error)
    alert('操作失败')
  }
}

const deleteExam = async (examId: number) => {
  if (!confirm('确定要删除这个考务安排吗？')) return

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/exam-arrangements/${examId}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      getExams()
    } else {
      alert(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除考务安排失败', error)
    alert('删除失败')
  }
}

const openAssignDialog = (exam: any) => {
  selectedExam.value = exam
  selectedTeacherId.value = ''
  getTeachers()
  showAssignDialog.value = true
}

const assignInvigilator = async () => {
  if (!selectedTeacherId.value) {
    alert('请选择教师')
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/exam-arrangements/${selectedExam.value.id}/invigilators`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ teacher_id: parseInt(selectedTeacherId.value) })
    })

    const result = await response.json()
    if (result.success) {
      showAssignDialog.value = false
      getExams()
    } else {
      alert(result.message || '分配失败')
    }
  } catch (error) {
    console.error('分配监考教师失败', error)
    alert('分配失败')
  }
}

const removeInvigilator = async (examId: number, teacherId: number) => {
  if (!confirm('确定要移除该监考教师吗？')) return

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/exam-arrangements/${examId}/invigilators/${teacherId}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      getExams()
    } else {
      alert(result.message || '移除失败')
    }
  } catch (error) {
    console.error('移除监考教师失败', error)
    alert('移除失败')
  }
}

onMounted(async () => {
  await checkAuth()
  if (user.value?.role === 'teacher') {
    getStudents()
  }
  getExams()
})
</script>

<template>
  <div class="task-assignment-view">
    <div class="title-section">
      <h1>任务分配与考务管理</h1>
    </div>

    <div class="main-content">
      <!-- 左侧：标签栏 -->
      <div v-if="user" class="left-panel">
        <div class="menu-section">
          <h3 class="menu-title">功能菜单</h3>
          <div
            class="menu-item"
            :class="{ active: activeMenu === 'taskAssignment' }"
            @click="activeMenu = 'taskAssignment'"
          >
            <span class="menu-text">任务分配</span>
          </div>
          <div
            class="menu-item"
            :class="{ active: activeMenu === 'examManagement' }"
            @click="activeMenu = 'examManagement'"
          >
            <span class="menu-text">考务管理</span>
          </div>
        </div>
      </div>

      <!-- 右侧：内容区域 -->
      <div class="right-panel">
        <!-- 任务分配内容 -->
        <div v-if="activeMenu === 'taskAssignment'" class="content-section">
          <div class="task-container">
            <!-- 左侧学生列表 -->
            <div class="student-list">
              <h3>我的学生</h3>
              <div class="search-container">
                <input
                  type="text"
                  v-model="searchKeyword"
                  placeholder="搜索学生（用户名/姓名）"
                  @keyup.enter="handleSearch"
                  class="search-input"
                />
                <button class="search-btn" @click="handleSearch">搜索</button>
              </div>
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
                  <div class="student-name">{{ student.name }}</div>
                  <div class="student-username">{{ student.username }}</div>
                </div>
              </div>
            </div>

            <!-- 右侧日志列表 -->
            <div class="student-logs">
              <div class="logs-header">
                <h3 v-if="selectedStudentId">
                  {{ students.find(s => s.id === selectedStudentId)?.name }}的工作日志
                </h3>
                <h3 v-else>选择学生查看日志</h3>

                <div v-if="selectedStudentId" class="date-filter">
                  <input type="date" v-model="startDate" placeholder="开始日期" />
                  <span class="date-separator">-</span>
                  <input type="date" v-model="endDate" placeholder="结束日期" />
                  <button class="filter-btn" @click="handleDateFilter">筛选</button>
                  <button class="clear-btn" @click="clearFilters">清除筛选</button>
                </div>
              </div>

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

        <!-- 考务管理内容 -->
        <div v-if="activeMenu === 'examManagement'" class="content-section">
          <div class="exam-header">
            <h2>考务管理</h2>
            <button v-if="user?.role === 'admin'" class="add-btn" @click="openExamForm()">
              + 新增考务安排
            </button>
          </div>

          <div v-if="loadingExams" class="loading-cell">
            <p>加载中...</p>
          </div>
          <div v-else-if="exams.length === 0" class="empty-cell">
            <p>暂无考务安排</p>
          </div>
          <div v-else class="exam-list">
            <div v-for="exam in exams" :key="exam.id" class="exam-card">
              <div class="exam-info">
                <h3>{{ exam.exam_name }}</h3>
                <div class="exam-details">
                  <div class="detail-item">
                    <span class="label">📅 日期：</span>
                    <span>{{ exam.exam_date }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">⏰ 时间：</span>
                    <span>{{ exam.start_time }} - {{ exam.end_time }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">📍 地点：</span>
                    <span>{{ exam.location }}</span>
                  </div>
                  <div v-if="exam.description" class="detail-item">
                    <span class="label">📝 说明：</span>
                    <span>{{ exam.description }}</span>
                  </div>
                </div>
              </div>

              <div class="invigilators-section">
                <h4>监考教师</h4>
                <div v-if="exam.invigilators.length === 0" class="no-invigilators">
                  暂无监考教师
                </div>
                <div v-else class="invigilator-list">
                  <div v-for="inv in exam.invigilators" :key="inv.id" class="invigilator-item">
                    <span>{{ inv.realname }} ({{ inv.username }})</span>
                    <button v-if="user?.role === 'admin'" class="remove-btn" @click="removeInvigilator(exam.id, inv.id)">
                      移除
                    </button>
                  </div>
                </div>
                <button v-if="user?.role === 'admin'" class="assign-btn" @click="openAssignDialog(exam)">
                  + 分配监考教师
                </button>
              </div>

              <div v-if="user?.role === 'admin'" class="exam-actions">
                <button class="edit-btn" @click="openExamForm(exam)">编辑</button>
                <button class="delete-btn" @click="deleteExam(exam.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 考务表单对话框 -->
    <div v-if="showExamForm" class="dialog-overlay" @click.self="showExamForm = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingExam ? '编辑考务安排' : '新增考务安排' }}</h3>
          <button class="close-btn" @click="showExamForm = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>考试名称 *</label>
            <input v-model="examForm.exam_name" type="text" placeholder="请输入考试名称" />
          </div>
          <div class="form-group">
            <label>考试日期 *</label>
            <input v-model="examForm.exam_date" type="date" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间 *</label>
              <input v-model="examForm.start_time" type="time" />
            </div>
            <div class="form-group">
              <label>结束时间 *</label>
              <input v-model="examForm.end_time" type="time" />
            </div>
          </div>
          <div class="form-group">
            <label>考试地点 *</label>
            <input v-model="examForm.location" type="text" placeholder="请输入考试地点" />
          </div>
          <div class="form-group">
            <label>考试说明</label>
            <textarea v-model="examForm.description" rows="3" placeholder="请输入考试说明"></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showExamForm = false">取消</button>
          <button class="submit-btn" @click="submitExamForm">提交</button>
        </div>
      </div>
    </div>

    <!-- 分配监考教师对话框 -->
    <div v-if="showAssignDialog" class="dialog-overlay" @click.self="showAssignDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>分配监考教师 - {{ selectedExam?.exam_name }}</h3>
          <button class="close-btn" @click="showAssignDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>选择教师</label>
            <select v-model="selectedTeacherId">
              <option value="">请选择教师</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.realname }} ({{ teacher.username }}) - {{ teacher.department }}
              </option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showAssignDialog = false">取消</button>
          <button class="submit-btn" @click="assignInvigilator">分配</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-assignment-view {
  width: 100%;
  min-height: 100vh;
  background: #f8f9fc;
  padding: 40px 30px;
  box-sizing: border-box;
  margin-top: 60px;
}

.title-section {
  margin-bottom: 24px;
}

.title-section h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.main-content {
  display: flex;
  gap: 24px;
  min-height: calc(100vh - 200px);
}

.left-panel {
  width: 220px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  background: #f9fafb;
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
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.content-section {
  height: 100%;
}

.task-container {
  display: flex;
  gap: 24px;
  height: calc(100vh - 280px);
}

.student-list {
  width: 280px;
  border-right: 1px solid #e5e7eb;
  padding-right: 20px;
  overflow-y: auto;
}

.student-list h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.search-container {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background: #5568d3;
}

.students {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 550px;
  overflow-y: auto;
}

.student-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.student-item:hover {
  background: #f3f4f6;
}

.student-item.active {
  background: #eef2ff;
  border-left: 3px solid #667eea;
}

.student-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.student-username {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

.student-logs {
  flex: 1;
  overflow-y: auto;
}

.logs-header {
  margin-bottom: 16px;
}

.logs-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.date-filter {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-filter input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.filter-btn,
.clear-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.filter-btn {
  background: #667eea;
  color: white;
}

.clear-btn {
  background: #f3f4f6;
  color: #374151;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.logs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.log-date {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.log-content {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
}

.log-file {
  margin-top: 8px;
}

.log-file a {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.log-file a:hover {
  text-decoration: underline;
}

/* 考务管理样式 */
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.exam-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.add-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.add-btn:hover {
  background: #5568d3;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exam-card {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.exam-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.exam-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  font-size: 14px;
  color: #374151;
}

.detail-item .label {
  font-weight: 600;
  color: #6b7280;
}

.invigilators-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.invigilators-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.no-invigilators {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 12px;
}

.invigilator-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.invigilator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 6px;
  font-size: 14px;
}

.remove-btn {
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background: #dc2626;
}

.assign-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.assign-btn:hover {
  background: #059669;
}

.exam-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.edit-btn {
  padding: 8px 16px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn:hover {
  background: #d97706;
}

.delete-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #dc2626;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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
}

.close-btn:hover {
  background: #e5e7eb;
}

.dialog-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.submit-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.submit-btn:hover {
  background: #5568d3;
}

/* 滚动条样式 */
.students::-webkit-scrollbar,
.logs::-webkit-scrollbar,
.left-panel::-webkit-scrollbar {
  width: 6px;
}

.students::-webkit-scrollbar-track,
.logs::-webkit-scrollbar-track,
.left-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.students::-webkit-scrollbar-thumb,
.logs::-webkit-scrollbar-thumb,
.left-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.students::-webkit-scrollbar-thumb:hover,
.logs::-webkit-scrollbar-thumb:hover,
.left-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 768px) {
  .task-assignment-view {
    padding: 20px 15px;
  }

  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .task-container {
    flex-direction: column;
  }

  .student-list {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding-right: 0;
    padding-bottom: 20px;
  }
}
</style>
