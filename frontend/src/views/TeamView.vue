<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const activeMenu = ref('我的团队')

// 菜单项目
const menuItems = [
  { name: '我的团队', category: '团队管理' },
  { name: '团队组建申请', category: '团队管理' }
]

// 团队组建申请表单
const teamForm = ref({
  theme: '',
  courses: [] as {
    courseName: string;
    teacherIds: number[];
  }[],
  members: [] as any[],
  description: ''
})

// 当前正在编辑的课程
const currentCourse = ref('')
const showCourseTeacherSelection = ref(false)

// 教师列表
const teachers = ref<any[]>([])
const searchKeyword = ref('')
const loadingTeachers = ref(false)

// 我的团队数据
const myTeams = ref<any[]>([])
const teamRequests = ref<any[]>([])
const loadingTeams = ref(false)

// 从 sessionStorage 获取用户信息
const getStoredUser = (): any => {
  const userStr = sessionStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// 检查用户认证状态
const checkAuth = async () => {
  // 首先尝试从 sessionStorage 读取
  const storedUser = getStoredUser()
  if (storedUser) {
    user.value = storedUser
    return
  }

  // 如果没有，尝试从后端验证
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/user/profile'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        user.value = result.user
        sessionStorage.setItem('user', JSON.stringify(result.user))
      } else {
        // 认证失败，跳转到登录页
        router.push('/login')
      }
    } else {
      // 认证失败，跳转到登录页
      router.push('/login')
    }
  } catch (error) {
    console.error('认证失败', error)
    router.push('/login')
  }
}

// 搜索教师
const searchTeachers = async () => {
  if (!searchKeyword.value) return

  loadingTeachers.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/teachers/search?keyword=${searchKeyword.value}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        teachers.value = result.teachers
      }
    }
  } catch (error) {
    console.error('搜索教师失败', error)
  } finally {
    loadingTeachers.value = false
  }
}

// 添加教师到团队
const addTeacherToTeam = (teacher: any) => {
  if (!teamForm.value.members.some(m => m.id === teacher.id)) {
    teamForm.value.members.push(teacher)
  }
}

// 从团队中移除教师
const removeTeacherFromTeam = (teacherId: number) => {
  teamForm.value.members = teamForm.value.members.filter(m => m.id !== teacherId)
}

// 添加课程
const addCourse = () => {
  if (currentCourse.value.trim()) {
    teamForm.value.courses.push({
      courseName: currentCourse.value.trim(),
      teacherIds: []
    })
    currentCourse.value = ''
  }
}

// 移除课程
const removeCourse = (index: number) => {
  teamForm.value.courses.splice(index, 1)
}

// 选择课程的授课教师
const currentCourseIndex = ref(-1)

const selectCourseTeacher = (teacher: any) => {
  if (currentCourseIndex.value === -1) return

  const course = teamForm.value.courses[currentCourseIndex.value]
  if (!course.teacherIds.includes(teacher.id)) {
    course.teacherIds.push(teacher.id)
  }
  showCourseTeacherSelection.value = false
  currentCourseIndex.value = -1
}

// 移除课程的授课教师
const removeCourseTeacher = (courseIndex: number, teacherId: number) => {
  const course = teamForm.value.courses[courseIndex]
  course.teacherIds = course.teacherIds.filter(id => id !== teacherId)
}

// 处理团队邀请
const handleTeamRequest = async (requestId: number, action: 'accept' | 'reject') => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/team/application/process'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        team_id: requestId,
        action: action
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        alert(`邀请已${action === 'accept' ? '接受' : '拒绝'}`)
        // 重新获取团队请求
        getTeamRequests()
        // 重新获取我的团队
        getMyTeams()
      } else {
        alert('操作失败: ' + (result.message || '未知错误'))
      }
    } else {
      try {
        const error = await response.json()
        alert('操作失败: ' + (error.message || '未知错误'))
      } catch {
        alert('操作失败: 服务器错误')
      }
    }
  } catch (error) {
    console.error('处理团队邀请失败', error)
    alert('操作失败: 网络错误')
  }
}

// 提交团队组建申请
const submitTeamApplication = async () => {
  try {
    // 检查必要参数
    if (!teamForm.value.theme || teamForm.value.courses.length === 0 || teamForm.value.members.length === 0) {
      alert('请填写完整的团队信息')
      return
    }

    // 检查是否所有课程都已分配授课教师
    const coursesWithNoTeacher = teamForm.value.courses.filter(course => course.teacherIds.length === 0)
    if (coursesWithNoTeacher.length > 0) {
      alert('请为所有课程分配授课教师')
      return
    }

    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/team/applications'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(teamForm.value)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        alert('团队组建申请已提交')
        teamForm.value = {
          theme: '',
          courses: [],
          members: [],
          description: ''
        }
        teachers.value = []
      } else {
        alert('提交失败: ' + (result.message || '未知错误'))
      }
    } else {
      // 显示错误信息
      try {
        const error = await response.json()
        alert('提交失败: ' + (error.message || '未知错误'))
      } catch {
        alert('提交失败: 服务器错误')
      }
    }
  } catch (error) {
    console.error('提交团队组建申请失败', error)
    alert('提交失败: 网络错误')
  }
}

// 获取我的团队
const getMyTeams = async () => {
  loadingTeams.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/team/my-teams'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        myTeams.value = result.teams
      }
    }
  } catch (error) {
    console.error('获取我的团队失败', error)
  } finally {
    loadingTeams.value = false
  }
}

// 获取团队请求
const getTeamRequests = async () => {
  loadingTeams.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/team/my-applications'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        teamRequests.value = result.applications
      }
    }
  } catch (error) {
    console.error('获取团队请求失败', error)
  } finally {
    loadingTeams.value = false
  }
}

// 处理菜单点击
const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
  if (item.name === '我的团队') {
    getMyTeams()
    getTeamRequests()
  }
}

// 组件挂载时检查认证状态
onMounted(() => {
  checkAuth()
  if (activeMenu.value === '我的团队') {
    getMyTeams()
    getTeamRequests()
  }
})
</script>




<template>
  <div class="team-view">
    <!-- 标题区域 -->
    <div class="title-section">
      <h1>教学团队</h1>
    </div>

    <!-- 主要内容区域：1-2布局 -->
    <div class="main-content">
      <!-- 左侧：标签栏 -->
      <div v-if="user" class="left-panel">
        <div class="menu-section">
          <h3 class="menu-title">团队管理</h3>
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
      <div v-else class="loading-panel">
        <p>加载中...</p>
      </div>

      <!-- 右侧：内容区域 -->
      <div class="right-panel">
        <!-- 我的团队页面 -->
        <div v-if="activeMenu === '我的团队'" class="team-content">
          <h2>我的团队</h2>

          <!-- 团队请求 -->
          <div class="team-section">
            <h3>团队邀请</h3>
            <div v-if="loadingTeams" class="loading">
              <p>加载中...</p>
            </div>
            <div v-else-if="teamRequests.length === 0" class="empty">
              <p>暂无团队邀请</p>
            </div>
            <div v-else class="team-requests">
              <div v-for="request in teamRequests" :key="request.id" class="team-request-card">
                <h4>{{ request.theme }}</h4>
                <p><strong>发起人：</strong>{{ request.initiator?.realname }}</p>
                <div><strong>课程：</strong></div>
                <div v-for="(course, index) in request.courses" :key="index" class="course-item">
                  - {{ course.courseName }} ({{ course.teacherNames.join(', ') }})
                </div>
                <p><strong>描述：</strong>{{ request.description }}</p>
                <div class="request-status">
                  <span class="status-label">当前选择：</span>
                  <span v-if="request.myStatus === 'accepted'" class="status accepted">已接受</span>
                  <span v-else-if="request.myStatus === 'rejected'" class="status rejected">已拒绝</span>
                  <span v-else class="status pending">待处理</span>
                </div>
                <div class="request-actions">
                  <button class="accept-btn" @click="handleTeamRequest(request.id, 'accept')" :class="{ active: request.myStatus === 'accepted' }">接受</button>
                  <button class="reject-btn" @click="handleTeamRequest(request.id, 'reject')" :class="{ active: request.myStatus === 'rejected' }">拒绝</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 已组成的团队 -->
          <div class="team-section">
            <h3>已组成的团队</h3>
            <div v-if="loadingTeams" class="loading">
              <p>加载中...</p>
            </div>
            <div v-else-if="myTeams.length === 0" class="empty">
              <p>暂无已组成的团队</p>
            </div>
            <div v-else class="teams-list">
              <div v-for="team in myTeams" :key="team.id" class="team-card">
                <h4>{{ team.theme }}</h4>
                <div><strong>课程：</strong></div>
                <div v-for="(course, index) in team.courses" :key="index" class="course-item">
                  - {{ course.courseName }} ({{ course.teacherNames.join(', ') }})
                </div>
                <p><strong>成员：</strong>{{ team.members.map((m: any) => m.realname).join(', ') }}</p>
                <p><strong>状态：</strong>{{ team.status }}</p>
                <button v-if="team.status === 'pending'" class="submit-btn">提交管理员确认</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 团队组建申请页面 -->
        <div v-if="activeMenu === '团队组建申请'" class="team-application-content">
          <h2>团队组建申请</h2>

          <form class="team-form">
            <div class="form-group">
              <label for="theme">团队主题</label>
              <input type="text" id="theme" v-model="teamForm.theme" required>
            </div>

            <div class="form-group">
              <label>课程及授课人员</label>
              <div class="courses-section">
                <!-- 添加课程 -->
                <div class="add-course">
                  <input
                    type="text"
                    v-model="currentCourse"
                    placeholder="输入课程名称"
                  >
                  <button type="button" @click="addCourse">添加课程</button>
                </div>

                <!-- 已添加的课程 -->
                <div v-if="teamForm.courses.length > 0" class="courses-list">
                  <div v-for="(course, index) in teamForm.courses" :key="index" class="course-item">
                    <div class="course-info">
                      <span>{{ course.courseName }}</span>
                      <div v-if="course.teacherIds.length > 0" class="teachers-list">
                        <span v-for="teacherId in course.teacherIds" :key="teacherId" class="teacher-tag">
                          {{ teamForm.members.find(m => m.id === teacherId)?.realname }}
                          <button type="button" class="remove-teacher-btn" @click="removeCourseTeacher(index, teacherId)">×</button>
                        </span>
                      </div>
                      <span v-else class="teacher-unassigned">未分配教师</span>
                    </div>
                    <div class="course-actions">
                      <button
                        type="button"
                        class="assign-teacher-btn"
                        @click="() => {
                          currentCourseIndex = index
                          showCourseTeacherSelection = true
                        }"
                      >
                        分配教师
                      </button>
                      <button type="button" class="remove-course-btn" @click="removeCourse(index)">
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 课程教师选择弹窗 -->
            <div v-if="showCourseTeacherSelection" class="teacher-selection-modal">
              <div class="modal-content">
                <h4>选择授课教师</h4>
                <div class="teachers-list">
                    <div v-for="member in teamForm.members" :key="member.id" class="teacher-option">
                      <span>{{ member.realname }} ({{ member.username }})</span>
                      <button type="button" @click="selectCourseTeacher(member)">
                        选择
                      </button>
                    </div>
                  </div>
                <button type="button" class="cancel-btn" @click="showCourseTeacherSelection = false">
                  取消
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>团队成员</label>
              <div class="members-section">
                <!-- 搜索教师 -->
                <div class="search-teachers">
                  <input
                    type="text"
                    v-model="searchKeyword"
                    placeholder="搜索教师"
                    @keyup.enter="searchTeachers"
                  >
                  <button type="button" @click="searchTeachers" :disabled="loadingTeachers">
                    {{ loadingTeachers ? '搜索中...' : '搜索' }}
                  </button>
                </div>

                <!-- 搜索结果 -->
                <div v-if="teachers.length > 0" class="teachers-list">
                  <h4>搜索结果</h4>
                  <div class="teachers-grid">
                    <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
                      <p><strong>{{ teacher.realname }}</strong></p>
                      <p>{{ teacher.username }}</p>
                      <button type="button" @click="addTeacherToTeam(teacher)">添加</button>
                    </div>
                  </div>
                </div>

                <!-- 已选择的成员 -->
                <div v-if="teamForm.members.length > 0" class="selected-members">
                  <h4>已选择的成员</h4>
                  <div class="members-list">
                    <div v-for="member in teamForm.members" :key="member.id" class="member-item">
                      <span>{{ member.realname }} ({{ member.username }})</span>
                      <button type="button" @click="removeTeacherFromTeam(member.id)">移除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="description">团队描述</label>
              <textarea id="description" v-model="teamForm.description" rows="4" required></textarea>
            </div>

            <button type="button" class="submit-btn" @click="submitTeamApplication">提交申请</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.team-view {
  padding: 80px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  margin-bottom: 30px;
  text-align: center;
}

.title-section h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  min-height: 600px;
}

/* 左侧面板 */
.left-panel {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-section {
  margin-bottom: 30px;
}

.menu-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.menu-item {
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.menu-item:hover {
  background-color: #e3f2fd;
  transform: translateX(5px);
}

.menu-item.active {
  background-color: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.4);
}

.menu-text {
  display: block;
  font-size: 1rem;
}

.loading-panel {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧面板 */
.right-panel {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.team-content h2,
.team-application-content h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

/* 团队部分 */
.team-section {
  margin-bottom: 30px;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.team-section h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

/* 团队请求卡片 */
.team-request-card {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #007bff;
}

.team-request-card h4 {
  margin-top: 0;
  color: #333;
}

.course-item {
  margin-left: 20px;
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

.request-status {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.status-label {
  font-weight: 600;
  margin-right: 8px;
  color: #495057;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status.accepted {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.rejected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.request-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.team-card h4 {
  margin-top: 0;
  color: #333;
}

.accept-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.accept-btn:hover {
  background-color: #45a049;
}

.reject-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reject-btn:hover {
  background-color: #d32f2f;
}

/* 团队卡片 */
.team-card {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #4caf50;
}

.team-card h4 {
  margin-top: 0;
  color: #333;
}

.submit-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.submit-btn:hover {
  background-color: #0069d9;
}

/* 团队组建表单 */
.team-form {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* 课程部分 */
.courses-section {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 15px;
}

.add-course {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.add-course input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-course button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-course button:hover {
  background-color: #0069d9;
}

.courses-list {
  margin-top: 15px;
}

.course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.teachers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.teacher-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4caf50;
  font-size: 12px;
  background-color: #e8f5e8;
  padding: 2px 8px;
  border-radius: 12px;
}

.remove-teacher-btn {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-teacher-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 50%;
}

.teacher-unassigned {
  color: #f44336;
  font-size: 12px;
  background-color: #ffe8e8;
  padding: 2px 8px;
  border-radius: 12px;
  align-self: flex-start;
}

.course-actions {
  display: flex;
  gap: 5px;
}

.assign-teacher-btn,
.remove-course-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.assign-teacher-btn {
  background-color: #007bff;
  color: white;
}

.assign-teacher-btn:hover {
  background-color: #0069d9;
}

.remove-course-btn {
  background-color: #f44336;
  color: white;
}

.remove-course-btn:hover {
  background-color: #d32f2f;
}

/* 教师选择弹窗 */
.teacher-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.teachers-list {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.teacher-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.teacher-option:last-child {
  border-bottom: none;
}

.teacher-option button {
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.teacher-option button:hover {
  background-color: #0069d9;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

/* 成员选择部分 */
.members-section {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 15px;
}

.search-teachers {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-teachers input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-teachers button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-teachers button:hover {
  background-color: #0069d9;
}

.search-teachers button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

/* 教师列表 */
.teachers-list {
  margin-bottom: 20px;
}

.teachers-list h4,
.selected-members h4 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 10px;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.teacher-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}

.teacher-card button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.teacher-card button:hover {
  background-color: #0069d9;
}

/* 已选择的成员 */
.selected-members {
  margin-top: 20px;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.member-item {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 16px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-item button {
  background-color: transparent;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-item button:hover {
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 50%;
}

/* 加载和空状态 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .left-panel {
    order: 2;
  }

  .right-panel {
    order: 1;
  }
}
</style>
