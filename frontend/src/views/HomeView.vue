<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)

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

    // 检查是否是企业用户，如果是则重定向到company页面
    if (storedUser.role === 'company') {
      router.push('/company')
    }
    return
  }

  // 如果没有，尝试从后端验证
  const token = sessionStorage.getItem('token')
  if (!token) {
    loading.value = false
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

      // 检查是否是企业用户，如果是则重定向到company页面
      if (result.user.role === 'company') {
        router.push('/company')
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  } finally {
    loading.value = false
  }
}

// 日历功能
const currentDate = ref(new Date())
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const showHeader = ref(true)
const lastScrollTop = ref(0)

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

// 监听滚动事件
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (scrollTop > lastScrollTop.value && scrollTop > 50) {
    // 向下滚动且超过100px，隐藏头部
    showHeader.value = false
  } else {
    // 向上滚动或在顶部，显示头部
    showHeader.value = true
  }

  lastScrollTop.value = scrollTop
}

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const days = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(year, month, 1 - firstDay.getDay())
  const endDate = new Date(year, month + 1, 6 - lastDay.getDay())

  const daysArray = []
  const today = new Date()

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    daysArray.push({
      date: new Date(d),
      day: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
      isOtherMonth: d.getMonth() !== month,
    })
  }

  return daysArray
})

// 我的申请
const myApplications = ref<any[]>([])
const loadingApplications = ref(false)

// 我的双选结果
const selectionResults = ref<any[]>([])
const loadingSelection = ref(false)

// 我的科研训练项目
const trainProjects = ref<any[]>([])
const loadingTrainProjects = ref(false)



// 我的实习
const internships = ref<any[]>([])
const loadingInternships = ref(false)

// 我的团队
const myTeams = ref<any[]>([])
const loadingTeams = ref(false)

// 公告列表
const announcements = ref<any[]>([])
const loadingAnnouncements = ref(false)
const activeAnnouncementTab = ref('announcement') // announcement 或 message
const showNotificationBadge = ref(true)
const currentPage = ref(1)
const pageSize = ref(3)
const searchQuery = ref('')
const unreadCount = ref(0)
const totalPages = computed(() => Math.ceil(filteredAnnouncements.value.length / pageSize.value))
const filteredAnnouncements = computed(() => {
  if (!searchQuery.value) {
    return announcements.value
  }
  const query = searchQuery.value.toLowerCase()
  return announcements.value.filter(announcement =>
    announcement.title.toLowerCase().includes(query)
  )
})
const paginatedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAnnouncements.value.slice(start, end)
})

// 获取未读公告数量
const getUnreadCount = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/announcements/unread-count'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      unreadCount.value = result.unread_count
      showNotificationBadge.value = unreadCount.value > 0
    }
  } catch (error) {
    console.error('获取未读公告数量失败', error)
  }
}

// 获取双选结果
const getSelectionResults = async () => {
  loadingSelection.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection-result'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 学生格式: { success: true, result: {...} }
      if (result.result) {
        selectionResults.value = [{
          id: result.result.studentId,
          teacherName: result.result.teacherName,
          status: result.result.status
        }]
      }
      // 教师格式: { success: true, students: [...] }
      else if (result.students) {
        // 使用学生ID作为唯一标识，确保不重复
        const uniqueStudents = new Map()
        result.students.forEach((student: any) => {
          if (!uniqueStudents.has(student.studentId)) {
            uniqueStudents.set(student.studentId, student)
          }
        })
        selectionResults.value = Array.from(uniqueStudents.values()).map((student: any) => ({
          id: student.studentId,
          studentName: student.studentName,
          status: student.status
        }))
      }
      // 管理员格式: { success: true, results: [...] }
      else if (result.results) {
        // 管理员不显示双选结果，显示为暂无数据
        selectionResults.value = []
      }
    }
  } catch (error) {
    console.error('获取双选结果失败', error)
  } finally {
    loadingSelection.value = false
  }
}

// 状态映射函数
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '申请中',
    'confirmed': '已确认',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

// 获取我的申请
const getMyApplications = async () => {
  loadingApplications.value = true
  try {
    const token = sessionStorage.getItem('token')
    // 获取学生实习申请列表
    const response = await fetch(buildURL('/api/student/applications'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 只显示状态为 pending 的申请
      const internshipApps = result.applications
        .filter((app: any) => app.status === 'pending')
        .map((app: any) => ({
          id: app.id,
          type: 'internship',
          name: `${app.company} - ${app.position}`,
          status: app.status
        }))

      // 保留原有的科研训练和双选申请
      const otherAppsResponse = await fetch(buildURL('/api/my-applications'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      const otherAppsResult = await otherAppsResponse.json()
      if (otherAppsResult.success) {
        myApplications.value = [...otherAppsResult.applications, ...internshipApps]
      } else {
        myApplications.value = internshipApps
      }
    }
  } catch (error) {
    console.error('获取我的申请失败', error)
  } finally {
    loadingApplications.value = false
  }
}

// 获取科研训练项目
const getTrainProjects = async () => {
  if (user.value?.role !== 'student') return
  loadingTrainProjects.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/research-projects/confirmed'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      trainProjects.value = result.projects
    }
  } catch (error) {
    console.error('获取科研训练项目失败', error)
  } finally {
    loadingTrainProjects.value = false
  }
}



// 获取实习信息
const getInternships = async () => {
  if (user.value?.role !== 'student') return
  loadingInternships.value = true
  try {
    const token = sessionStorage.getItem('token')
    // 获取学生实习申请列表
    const response = await fetch(buildURL('/api/student/applications'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 只显示状态为 confirmed 的申请
      internships.value = result.applications
        .filter((app: any) => app.status === 'confirmed')
        .map((app: any) => ({
          id: app.id,
          company: app.company,
          position: app.position,
          status: app.status
        }))
    }
  } catch (error) {
    console.error('获取实习信息失败', error)
  } finally {
    loadingInternships.value = false
  }
}

// 获取教师团队信息
const getMyTeams = async () => {
  if (user.value?.role !== 'teacher') return
  loadingTeams.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/team/my-teams'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      myTeams.value = result.teams
    }
  } catch (error) {
    console.error('获取团队信息失败', error)
  } finally {
    loadingTeams.value = false
  }
}

// 获取公告列表
const getAnnouncements = async () => {
  loadingAnnouncements.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/announcements'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      announcements.value = result.announcements
      // 获取未读公告数量
      await getUnreadCount()
    }
  } catch (error) {
    console.error('获取公告信息失败', error)
  } finally {
    loadingAnnouncements.value = false
  }
}

onMounted(async () => {
  await checkAuth()
  // 获取我的申请
  getMyApplications()
  // 获取双选结果（对学生和教师）
  getSelectionResults()
  // 获取科研训练项目和实习信息（仅对学生）
  if (user.value?.role === 'student') {
    getTrainProjects()
    getInternships()
  }
  // 获取团队信息（仅对教师）
  if (user.value?.role === 'teacher') {
    getMyTeams()
  }

  // 获取公告列表
  await getAnnouncements()

  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
})

// 组件卸载时移除滚动事件监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="home">
    <!-- 上方欢迎区域（1） -->
    <div class="home-header" :class="{ 'header-hidden': !showHeader }">
      <h1 v-if="user?.role == 'student'">欢迎回来，{{ user?.realname }}同学！</h1>
      <h1 v-if="user?.role == 'teacher'">欢迎回来，{{ user?.realname }}老师！</h1>
      <h1 v-if="user?.role == 'admin'">欢迎回来，{{ user?.realname }}管理员！</h1>
      <p class="current-date">今天是{{ currentYear }}年{{ currentMonth }}月{{ currentDate.getDate() }}日 星期{{ weekdays[currentDate.getDay()] }}</p>
    </div>

    <!-- 中间内容区域（2） -->
    <div class="home-content">
      <!-- 左侧空白区域（为以后功能区） -->
      <div class="left-sidebar">
        <!-- 我的申请 -->
        <div class="my-applications">
          <h3>我的申请</h3>
          <div class="table-container">
            <table class="project-table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>名称</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingApplications">
                  <td colspan="3" class="loading-cell">
                    <p>加载中...</p>
                  </td>
                </tr>
                <tr v-else-if="!myApplications || myApplications.length === 0">
                  <td colspan="3" class="empty-cell">
                    <p>暂无申请记录</p>
                  </td>
                </tr>
                <tr v-for="app in myApplications || []" :key="app.id">
                  <td>{{ app.type === 'research' ? '科研训练' : app.type === 'internship' ? '实习' : '双选' }}</td>
                  <td>{{ app.name }}</td>
                  <td>{{ getStatusText(app.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 我的双选结果/我的学生 -->
        <div class="selection-results">
          <h3 v-if="user?.role === 'student'">我的双选结果</h3>
          <h3 v-else-if="user?.role === 'teacher'">我的学生</h3>
          <h3 v-else>双选结果</h3>
          <div class="table-container">
            <table class="project-table">
              <thead>
                <tr v-if="user?.role === 'student'">
                  <th>导师</th>
                </tr>
                <tr v-else-if="user?.role === 'teacher'">
                  <th>学生</th>
                </tr>
                <tr v-else>
                  <th>名称</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingSelection">
                  <td colspan="1" class="loading-cell">
                    <p>加载中...</p>
                  </td>
                </tr>
                <tr v-else-if="!selectionResults || selectionResults.length === 0">
                  <td colspan="1" class="empty-cell">
                    <p v-if="user?.role === 'student'">暂无双选结果</p>
                    <p v-else-if="user?.role === 'teacher'">暂无学生</p>
                    <p v-else>暂无数据</p>
                  </td>
                </tr>
                <tr v-for="result in selectionResults || []" :key="result.id">
                  <td v-if="user?.role === 'student'">{{ result.teacherName }}</td>
                  <td v-else-if="user?.role === 'teacher'">{{ result.studentName }}</td>
                  <td v-else>{{ result.teacherName || result.studentName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 我的实习（学生）/ 我的团队（教师） -->
        <div v-if="user?.role === 'student'" class="internships">
          <h3>我的实习</h3>
          <div class="table-container">
            <table class="project-table">
              <thead>
                <tr>
                  <th>公司</th>
                  <th>职位</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingInternships">
                  <td colspan="3" class="loading-cell">
                    <p>加载中...</p>
                  </td>
                </tr>
                <tr v-else-if="!internships || internships.length === 0">
                  <td colspan="3" class="empty-cell">
                    <p>暂无实习信息</p>
                  </td>
                </tr>
                <tr v-for="internship in internships || []" :key="internship.id">
                  <td>{{ internship.company }}</td>
                  <td>{{ internship.position }}</td>
                  <td>
                    <span class="status-badge" :class="internship.status">
                      {{
                        internship.status === 'confirmed'
                          ? '已确认'
                          : internship.status === 'rejected'
                            ? '已拒绝'
                            : '待确认'
                      }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 我的团队（教师） -->
        <div v-else-if="user?.role === 'teacher'" class="internships">
          <h3>我的团队</h3>
          <div class="table-container">
            <table class="project-table">
              <thead>
                <tr>
                  <th>团队主题</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingTeams">
                  <td colspan="3" class="loading-cell">
                    <p>加载中...</p>
                  </td>
                </tr>
                <tr v-else-if="!myTeams || myTeams.length === 0">
                  <td colspan="3" class="empty-cell">
                    <p>暂无团队信息</p>
                  </td>
                </tr>
                <tr v-for="team in myTeams || []" :key="team.id">
                  <td>{{ team.theme }}</td>
                  <td>
                    <span class="status-badge" :class="team.status">
                      {{
                        team.status === 'pending'
                          ? '待审批'
                          : team.status === 'approved'
                            ? '已批准'
                            : team.status === 'rejected'
                              ? '已拒绝'
                              : team.status
                      }}
                    </span>
                  </td>
                  <td>
                    <RouterLink to="/team" class="function-link">查看详情</RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 我的科研训练项目 -->
        <div class="train-projects" style="grid-column: 1 / -1">
          <h3>我的科研训练项目</h3>
          <div class="table-container">
            <table class="project-table">
              <thead>
                <tr>
                  <th>批次</th>
                  <th>研究方向</th>
                  <th>项目名称</th>
                  <th>导师</th>
                  <th>申请时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingTrainProjects">
                  <td colspan="5" class="loading-cell">
                    <p>加载中...</p>
                  </td>
                </tr>
                <tr v-else-if="trainProjects.length === 0">
                  <td colspan="5" class="empty-cell">
                    <p>暂无科研训练项目</p>
                  </td>
                </tr>
                <tr v-for="project in trainProjects" :key="project.id">
                  <td>{{ project.batch }}</td>
                  <td>{{ project.direction }}</td>
                  <td>{{ project.projectName }}</td>
                  <td>{{ project.teacherName }}</td>
                  <td>{{ project.createTime }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


      </div>

      <!-- 右侧内容区域 -->
      <div class="right-content">
        <!-- 系统功能模块 -->
        <div class="system-functions">
          <h3>系统功能</h3>
          <!-- 管理员用户显示一个大的管理员面板按钮 -->
          <div v-if="user?.role === 'admin'" class="function-grid admin-function">
            <div class="function-item admin-item">
              <div class="function-icon">⚙️</div>
              <RouterLink to="/admin" class="function-link">管理员面板</RouterLink>
            </div>
          </div>
          <!-- 其他用户显示普通功能按钮 -->
          <div v-else class="function-grid">
            <div class="function-item">
              <div class="function-icon">🎓</div>
              <RouterLink to="/double-selection" class="function-link">导师双选</RouterLink>
            </div>
            <div class="function-item" v-if="user?.role === 'student'">
              <div class="function-icon">📋</div>
              <RouterLink to="/internship" class="function-link">我的实习</RouterLink>
            </div>
            <div class="function-item" v-if="user?.role === 'teacher'">
              <div class="function-icon">📋</div>
              <RouterLink to="/team" class="function-link">教学团队</RouterLink>
            </div>
            <div class="function-item">
              <div class="function-icon">✅</div>
              <RouterLink to="/task-assignment" class="function-link">任务分配</RouterLink>
            </div>
            <div class="function-item">
              <div class="function-icon">📊</div>
              <RouterLink to="/train" class="function-link">科研训练</RouterLink>
            </div>
          </div>
        </div>

        <!-- 公告栏模块 -->
        <div class="announcement-section">
          <div class="announcement-header">
            <h3>公告消息情况</h3>
            <div class="announcement-header-right">
              <div class="announcement-search" v-if="activeAnnouncementTab === 'announcement'">
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="搜索公告..."
                  class="search-input"
                >
                <button class="search-button" @click="currentPage = 1">
                  <span class="search-icon">🔍</span>
                </button>
              </div>
              <div class="announcement-tabs">
                <div
                  class="tab"
                  :class="{ active: activeAnnouncementTab === 'announcement' }"
                  @click="activeAnnouncementTab = 'announcement'; showNotificationBadge = false; searchQuery = ''; currentPage = 1"
                >
                  公告
                  <span v-if="unreadCount > 0 && showNotificationBadge" class="notification-badge">{{ unreadCount }}</span>
                </div>
                <div
                  class="tab"
                  :class="{ active: activeAnnouncementTab === 'message' }"
                  @click="activeAnnouncementTab = 'message'; searchQuery = ''"
                >
                  消息
                </div>
              </div>
            </div>
          </div>
          <div class="announcement-content">
            <div v-if="loadingAnnouncements" class="loading-cell">
              <p>加载中...</p>
            </div>
            <div v-else-if="activeAnnouncementTab === 'announcement'">
              <div v-if="announcements.length === 0" class="empty-cell">
                <p>暂无公告</p>
              </div>
              <div
                v-for="announcement in paginatedAnnouncements"
                :key="announcement.id"
                class="announcement-item"
              >
                <div class="announcement-icon">📑</div>
                <div class="announcement-info">
                  <router-link
                    :to="`/announcement/${announcement.id}`"
                    class="announcement-title"
                  >
                    {{ announcement.title }}
                  </router-link>
                  <div class="announcement-time">{{ announcement.created_at }}</div>
                  <div v-if="announcement.attachments && announcement.attachments.length > 0" class="announcement-attachments">
                    <span class="attachment-icon">📎</span>
                    <span class="attachment-count">{{ announcement.attachments.length }}个附件</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeAnnouncementTab === 'message'" class="empty-cell">
              <p>暂无消息</p>
            </div>
          </div>
          <div class="announcement-footer">
            <div class="pagination" v-if="activeAnnouncementTab === 'announcement'">
              <button
                class="page-btn"
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
              >
                上一页
              </button>
              <span class="page-info">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button
                class="page-btn"
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
              >
                下一页
              </button>
            </div>
            <div v-else>
              <a href="#" class="announcement-link" @click.prevent="getAnnouncements">刷新</a>
            </div>
          </div>
        </div>

        <!-- 日历模块 -->
        <div class="calendar-section">
          <h3>日历</h3>
          <div class="calendar">
            <div class="calendar-header">
              <button @click="prevMonth" class="calendar-nav">&lt;</button>
              <h4>{{ currentYear }}年{{ currentMonth }}月</h4>
              <button @click="nextMonth" class="calendar-nav">&gt;</button>
            </div>
            <div class="calendar-weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>
            <div class="calendar-days">
              <div
                v-for="day in days"
                :key="day.date"
                class="calendar-day"
                :class="{
                  today: day.isToday,
                  'other-month': day.isOtherMonth,
                }"
              >
                {{ day.day }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方Logo区域（1） -->
    <div class="home-footer">
      <div class="logo">教学管理辅助系统</div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 - 占满浏览器背景 */
.home {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  margin-top: 60px; /* 为上方导航栏留出空间，避免内容被遮盖 */
  position: relative;
  left: 0;
  right: 0;
}

/* 上方欢迎区域（1） */
.home-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.home-header:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.home-header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  transition: color 0.3s ease;
}

.current-date {
  color: #666;
  font-size: 16px;
  margin: 10px 0 0 0;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 头部隐藏效果 */
.home-header {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.home-header.header-hidden {
  transform: translateY(-100%);
  box-shadow: none;
}

/* 中间内容区域（2） */
.home-content {
  width: 100%;
  display: grid;
  grid-template-columns: 6fr 1fr;
  gap: 40px;
  padding: 40px 30px;
  flex: 1;
  box-sizing: border-box;
}

/* 左侧空白区域 */
.left-sidebar {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  width: 100%;
}

.my-applications {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  grid-column: 1 / -1;
}

.selection-results,
.internships,
.train-projects {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.my-applications:hover,
.selection-results:hover,
.internships:hover,
.train-projects:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.left-sidebar:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.left-sidebar h3 {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
}

.selection-results .table-container,
.train-projects .table-container,
.internships .table-container {
  max-height: 200px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.project-table thead {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  position: sticky;
  top: 0;
  z-index: 1;
}

.project-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.project-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  color: #34495e;
}

.project-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 20px !important;
  color: #666;
}

.loading-cell p,
.empty-cell p {
  font-size: 14px;
  color: #999;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.confirmed {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.status-badge.pending {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.status-badge.rejected {
  background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
  color: white;
}

/* 右侧内容区域 */
.right-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
  box-sizing: border-box;
}

/* 系统功能模块 */
.system-functions {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.system-functions:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.system-functions h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
  transition: border-color 0.3s ease;
}

.system-functions:hover h3 {
  border-color: #764ba2;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  box-sizing: border-box;
  min-width: 600px;
}

/* 管理员功能按钮样式 */
.admin-function {
  grid-template-columns: 1fr;
}

.admin-item {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-decoration: none;
  color: #333;
}

.admin-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background-color: #e3f2fd;
}

.admin-item .function-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.admin-item .function-link {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
}

.function-item {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.function-item:hover {
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
}

.function-icon {
  font-size: 48px;
  margin-bottom: 15px;
  transition: transform 0.3s ease;
}

.function-item:hover .function-icon {
  transform: scale(1.1);
}

.function-link {
  display: block;
  color: #2c3e50;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
  font-size: 16px;
}

.function-link:hover {
  color: #667eea;
}

/* 公告栏模块 */
.announcement-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  height: 450px;
  display: flex;
  flex-direction: column;
}

.announcement-section:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.announcement-header {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  color: white;
  padding: 20px 25px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;
}

.announcement-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
}

.announcement-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  position: relative;
  z-index: 1;
  color: white;
  border: none;
  padding: 0;
  flex: 1;
  min-width: 120px;
}

.announcement-header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 300px;
  justify-content: flex-end;
}

.announcement-search {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.search-input:focus {
  background: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.search-icon {
  color: #666;
  font-size: 14px;
}

.search-button {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.search-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.announcement-tabs {
  display: flex;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.announcement-tabs .tab {
  padding: 5px 0;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.announcement-tabs .tab.active {
  color: white;
  font-weight: 600;
}

.announcement-tabs .tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: white;
}

.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff5722;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 5px;
  position: relative;
  top: -2px;
}

.announcement-content {
  padding: 20px 25px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.announcement-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.announcement-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.announcement-info {
  flex: 1;
}

.announcement-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e88e5;
  margin-bottom: 5px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.announcement-title:hover {
  color: #1565c0;
  text-decoration: underline;
}

.announcement-attachments {
  font-size: 12px;
  color: #666;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.attachment-icon {
  font-size: 12px;
}

.attachment-count {
  font-size: 11px;
}

.announcement-time {
  font-size: 12px;
  color: #999;
}

.announcement-footer {
  padding: 15px 25px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

.announcement-link {
  font-size: 13px;
  color: #1e88e5;
  text-decoration: none;
  transition: color 0.3s ease;
}

.announcement-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.announcement-divider {
  color: #ccc;
  font-size: 13px;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  width: 100%;
}

.page-btn {
  background: #1e88e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.3);
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-info {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}






/* 日历模块 */
.calendar-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.calendar-section:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.calendar-section h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
  transition: border-color 0.3s ease;
}

.calendar-section:hover h3 {
  border-color: #764ba2;
}

.calendar {
  width: 100%;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.calendar-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.calendar-nav {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 16px;
}

.calendar-nav:hover {
  background: #764ba2;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(118, 75, 162, 0.4);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 14px;
  padding: 10px;
  border-radius: 8px;
  background: #f8f9ff;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #f8f9ff;
  border: 1px solid #e9ecef;
}

.calendar-day:hover {
  background: #e3e7ff;
  transform: scale(1.05);
  border-color: #667eea;
}

.calendar-day.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.calendar-day.other-month {
  color: #ccc;
  background: #f0f0f0;
}

/* 下方Logo区域（1） */
.home-footer {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.home-footer:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.home-footer:hover .logo {
  color: #764ba2;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .home-content {
    grid-template-columns: 1fr 2fr;
  }

  .function-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .home {
    margin-top: 70px; /* 导航栏高度调整 */
  }

  .home-header {
    padding: 30px;
  }

  .home-header h1 {
    font-size: 24px;
  }

  .home-content {
    grid-template-columns: 1fr;
    padding: 30px;
    gap: 30px;
  }

  .left-sidebar {
    min-height: 200px;
    padding: 30px;
  }

  .system-functions,
  .calendar-section {
    padding: 30px;
  }

  .function-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .function-item {
    padding: 20px;
  }

  .function-icon {
    font-size: 32px;
  }

  .calendar-header h4 {
    font-size: 16px;
  }

  .home-footer {
    padding: 30px;
  }

  .logo {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .function-grid {
    grid-template-columns: 1fr;
  }

  .calendar-day {
    font-size: 14px;
  }
}
</style>
