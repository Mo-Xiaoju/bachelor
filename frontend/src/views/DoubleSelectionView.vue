<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()

// 数据状态
const currentStep = ref(0) // 0: 未开始, 1: 学生选导师, 2: 导师确认, 3: 双选完成
const teachers = ref<any[]>([])
const mySelections = ref<any[]>([])
const students = ref<any[]>([])
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const user = ref<any>(null)
const doubleSelectionResult = ref<any>(null)
const doubleSelectionTimes = ref<any>({})
const minQuota = ref(0)
const maxQuota = ref(5)

// 搜索和分页
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(4)

// 计算属性：过滤后的教师列表
const filteredTeachers = computed(() => {
  let result = [...teachers.value]

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(teacher =>
      teacher.realname.toLowerCase().includes(keyword) ||
      (teacher.major && teacher.major.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 计算属性：当前页的教师列表
const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTeachers.value.slice(start, end)
})

// 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(filteredTeachers.value.length / pageSize.value)
})

// 翻页方法
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 搜索方法
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}
const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')

  return token
}
// 获取当前登录用户信息
const getUserInfo = async () => {
  const token = getToken()
  try {
    const response = await fetch(buildURL('/api/check-auth'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      user.value = result.user
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 获取双选阶段
const getCurrentStep = async () => {
  const token = getToken()
  try {
    const response = await fetch(buildURL('/api/double-selection/step'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      currentStep.value = result.step
    }
  } catch (error) {
    console.error('获取双选阶段失败', error)
  }
}

// 获取导师列表（从双选系统中）
const getTeachers = async () => {
  loading.value = true
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/double-selection/teachers/list'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      teachers.value = result.teachers
    }
  } catch (error) {
    errorMessage.value = '获取导师列表失败'
  } finally {
    loading.value = false
  }
}

// 获取我的选择
const getMySelections = async () => {
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/my-selection'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      mySelections.value = result.selections || []
    }
  } catch (error) {
    console.error('获取我的选择失败', error)
  }
}

// 获取选择当前导师的学生列表（导师视角）
const getStudents = async () => {
  loading.value = true
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/students-for-teacher'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      students.value = result.students || []
    }
  } catch (error) {
    errorMessage.value = '获取学生列表失败'
  } finally {
    loading.value = false
  }
}

// 导师确认学生
const confirmStudent = async (selectionId: number) => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/confirm-selection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ selectionId }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '确认学生成功'
      await getStudents() // 刷新学生列表
      await getTeachers() // 刷新教师列表，更新名额数据
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 导师拒绝学生
const rejectStudent = async (selectionId: number) => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/reject-selection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ selectionId }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '拒绝学生成功'
      await getStudents() // 刷新学生列表
      await getTeachers() // 刷新教师列表，更新名额数据
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 导师撤回选择（将已确认的选择变回待确认）
const revokeSelection = async (selectionId: number) => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/revoke-selection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ selectionId }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '撤回选择成功'
      await getStudents() // 刷新学生列表
      await getTeachers() // 刷新教师列表，更新名额数据
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 选择导师
const selectTeacher = async (teacherId: number) => {
  if (currentStep.value !== 1) {
    errorMessage.value = '当前不在选导师阶段'
    return
  }

  // 检查是否已经选择了该导师
  const alreadySelected = mySelections.value.some((s: any) => s.teacherId === teacherId)
  if (alreadySelected) {
    errorMessage.value = '您已经选择过该导师了'
    return
  }

  // 检查是否已经有两个志愿
  if (mySelections.value.length >= 2) {
    errorMessage.value = '您已经选择了两名导师'
    return
  }

  // 自动判断志愿优先级
  const priority = mySelections.value.length + 1 // 如果已选0个，则为1；如果已选1个，则为2

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/select-teacher'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ teacherId, priority }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = `第${priority}志愿选择导师成功`
      mySelections.value.push(result.selection)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 报名参与双选
const joinDoubleSelection = async () => {
  if (currentStep.value !== 0) {
    errorMessage.value = '当前不在报名阶段'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/double-selection/teachers/join'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ min_quota: minQuota.value, max_quota: maxQuota.value }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '报名成功'
      // 3秒后清除成功消息
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('报名失败', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 取消选择
const cancelSelection = async (selectionId: number) => {
  const selection = mySelections.value.find((s: any) => s.id === selectionId)
  if (!selection || selection.status !== 'pending') {
    errorMessage.value = '无法取消选择'
    return
  }

  loading.value = true
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/cancel-selection'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ selectionId }),
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '已取消选择'
      mySelections.value = mySelections.value.filter((s: any) => s.id !== selectionId)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '等待确认',
    'confirmed': '已确认',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}
// 计算属性：是否已选择导师
const hasSelected = computed(() => mySelections.value.length > 0)

// 计算属性：已选择的导师ID列表
const selectedTeacherIds = computed(() => mySelections.value.map((s: any) => s.teacherId))

// 计算属性：第一志愿
const firstChoice = computed(() => mySelections.value.find((s: any) => s.priority === 1))

// 计算属性：第二志愿
const secondChoice = computed(() => mySelections.value.find((s: any) => s.priority === 2))

// 计算属性：是否已选择两名导师
const hasBothChoices = computed(() => mySelections.value.length === 2)

// 计算属性：导师是否已确认
const isConfirmed = computed(() => mySelections.value.some((s: any) => s.status === 'confirmed'))

// 计算属性：导师是否已拒绝
const isRejected = computed(() => mySelections.value.some((s: any) => s.status === 'rejected'))

// 计算属性：是否为学生用户
const isStudent = computed(() => {
  const result = user.value && user.value.role === 'student'

  return result
})

// 计算属性：是否为教师用户
const isTeacher = computed(() => {
  const result = user.value && user.value.role === 'teacher'

  return result
})

// 计算属性：当前教师的名额信息
const currentTeacherQuota = computed(() => {
  if (isTeacher.value && user.value?.id) {
    // 从教师列表中找到当前教师的信息
    const currentTeacher = teachers.value.find(t => t.id === user.value?.id)
    if (currentTeacher) {
      return {
        currentQuota: currentTeacher.current_quota || 0,
        maxQuota: currentTeacher.max_quota !== undefined ? currentTeacher.max_quota : 5 // 只有当max_quota未定义时才使用默认值5
      }
    }
  }
  return {
    currentQuota: 0,
    maxQuota: 5
  }
})

// 计算属性：是否可以查看导师列表
const canViewTeachers = computed(() => {
  const result = currentStep.value === 1 && isStudent.value

  return result
})

// 获取双选结果
const getDoubleSelectionResult = async () => {
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/double-selection-result'), {
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    const result = await response.json()
    if (result.success) {
      // 根据用户角色处理不同的返回结构
      if (user.value?.role === 'student') {
        doubleSelectionResult.value = result.result
      } else if (user.value?.role === 'teacher') {
        // 教师视角：将students数组赋值给students ref
        students.value = result.students || []
      } else if (user.value?.role === 'admin') {
        // 管理员视角：处理all_results
        doubleSelectionResult.value = result.results
      }
    }
  } catch (error) {
    console.error('获取双选结果失败', error)
  }
}

// 获取双选阶段时间
const getDoubleSelectionTime = async () => {
  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/double-selection/time'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include'
    })
    const result = await response.json()
    if (result.success) {
      doubleSelectionTimes.value = result.times || {}
    }
  } catch (error) {
    console.error('获取双选阶段时间失败', error)
  }
}

onMounted(async () => {
  await getUserInfo()

  // 检查学生是否已有双选导师
  if (user.value?.role === 'student') {
    await getDoubleSelectionResult()
    if (doubleSelectionResult.value) {
      // 学生已有双选导师，提示并回退到homeview
      alert('您已经有双选导师，无法再次进入双选界面')
      router.push('/')
      return
    }
  }

  await getCurrentStep()
  await getTeachers()
  await getMySelections()
  await getDoubleSelectionTime()

  // 如果是教师且处于导师确认阶段，获取选择该导师的学生列表
  if (user.value?.role === 'teacher' && currentStep.value === 2) {
    await getStudents()
  }

  // 如果双选已完成，获取双选结果（会根据用户角色自动处理）
  if (currentStep.value === 3) {
    await getDoubleSelectionResult()
  }
})
</script>

<template>
  <div class="double-selection">
    <!-- 时间信息区域 -->
    <div class="time-info" v-if="doubleSelectionTimes[currentStep] && doubleSelectionTimes[currentStep].endTime">
      <div class="time-info-content">
        <span class="time-label">本阶段截止至：</span>
        <span class="time-value">{{ doubleSelectionTimes[currentStep].endTime }}</span>
      </div>
    </div>

    <div class="layout-container">
      <!-- 左侧：阶段指示器 -->
      <div class="left-panel">
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep >= 0, current: currentStep === 0 }">
            <span class="step-number">1</span>
            <span class="step-text">准备阶段</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 1 }"></div>
          <div class="step" :class="{ active: currentStep >= 1, current: currentStep === 1 }">
            <span class="step-number">2</span>
            <span class="step-text">学生选导师</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
          <div class="step" :class="{ active: currentStep >= 2, current: currentStep === 2 }">
            <span class="step-number">3</span>
            <span class="step-text">导师确认</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
          <div class="step" :class="{ active: currentStep >= 3, current: currentStep === 3 }">
            <span class="step-number">4</span>
            <span class="step-text">双选完成</span>
          </div>
        </div>

        <!-- 消息提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <!-- 双选完成 -->
        <div class="completed-section" v-if="currentStep === 3 && user?.role === 'student'">
          <div class="success-icon">✓</div>
          <h2>恭喜！双选已完成</h2>
          <p v-if="doubleSelectionResult">
            您的导师是：<strong>{{ doubleSelectionResult.teacherName }}</strong>
          </p>
          <p v-else-if="isConfirmed">
            您的导师是：<strong>{{ firstChoice?.teacherName || secondChoice?.teacherName }}</strong>
          </p>
          <p v-else>
            双选已完成，正在获取结果...
          </p>
          <p>请尽快与导师联系，开始您的相关工作。</p>
        </div>
      </div>

      <!-- 右侧：导师列表和选择状态 -->
      <div class="right-panel">
        <!-- 导师列表 -->
        <div class="teachers-section" v-if="canViewTeachers">
          <div class="teachers-header">
            <h2>可选导师列表</h2>
            <!-- 搜索功能 -->
            <div class="search-container">
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="按姓名或专业搜索"
                class="search-input"
                @keyup.enter="handleSearch"
              />
              <button class="search-btn" @click="handleSearch">
                搜索
              </button>
            </div>
          </div>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="paginatedTeachers.length === 0" class="no-results">
            {{ searchKeyword ? '未找到匹配的导师' : '暂无导师数据' }}
          </div>
          <div v-else class="teachers-grid">
            <div
              v-for="teacher in paginatedTeachers"
              :key="teacher.id"
              class="teacher-card"
              :class="{
                selected: selectedTeacherIds.includes(teacher.id),
                disabled:
                  selectedTeacherIds.includes(teacher.id) ||
                  (teacher.current_quota || 0) >= (teacher.max_quota || 0),
              }"
            >
              <div class="teacher-header">
                <h3>{{ teacher.realname }}</h3>
                <span class="quota"> 名额: {{ teacher.current_quota || 0 }}/{{ teacher.max_quota || 0 }} </span>
              </div>
              <div class="teacher-info">
                <p><strong>工号：</strong>{{ teacher.username }}</p>
                <p><strong>专业：</strong>{{ teacher.major || '暂无' }}</p>
                <p><strong>名额：</strong>{{ teacher.current_quota || 0 }}/{{ teacher.max_quota || 0 }}</p>
              </div>
              <div class="teacher-actions">
                <div
                  v-if="
                    !selectedTeacherIds.includes(teacher.id) &&
                    (teacher.current_quota || 0) < (teacher.max_quota || 0) &&
                    mySelections.length < 2
                  "
                >
                  <button
                    v-if="mySelections.length === 0"
                    class="select-btn"
                    @click="selectTeacher(teacher.id)"
                    :disabled="loading"
                  >
                    选择为第一志愿
                  </button>
                  <button
                    v-else-if="firstChoice && !secondChoice"
                    class="select-btn secondary"
                    @click="selectTeacher(teacher.id)"
                    :disabled="loading"
                  >
                    选择为第二志愿
                  </button>
                </div>
                <span v-else-if="selectedTeacherIds.includes(teacher.id)" class="selected-tag">
                  已选择
                </span>
                <span v-else-if="(teacher.current_quota || 0) >= (teacher.max_quota || 0)" class="full-tag"
                  >名额已满</span
                >
                <span v-else-if="mySelections.length >= 2" class="full-tag">已选两名导师</span>
                <span v-else-if="selectedTeacherIds.includes(teacher.id)" class="selected-tag">
                  已选择
                </span>
                <span v-else-if="(teacher.current_quota || 0) >= (teacher.max_quota || 0)" class="full-tag"
                  >名额已满</span
                >
              </div>
            </div>
          </div>

          <!-- 分页功能 -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              class="page-btn"
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
            >
              上一页
            </button>
            <span class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页
            </span>
            <button
              class="page-btn"
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
            >
              下一页
            </button>
          </div>
        </div>

        <!-- 选择状态 -->
        <div class="status-card" v-if="mySelections.length > 0 && currentStep !== 0">
          <h3>我的选择</h3>
          <div class="selections-container">
            <div
              v-for="selection in mySelections"
              :key="selection.id"
              class="choice-card"
              :class="{
                'first-choice': selection.priority === 1,
                'second-choice': selection.priority === 2,
              }"
            >
              <div class="choice-header">
                <span class="choice-badge">第{{ selection.priority }}志愿</span>
                <span class="status" :class="selection.status">
                  {{
                    selection.status === 'pending'
                      ? '等待确认'
                      : selection.status === 'confirmed'
                        ? '已确认'
                        : '已拒绝'
                  }}
                </span>
              </div>
              <div class="choice-info">
                <p><strong>导师姓名：</strong>{{ selection.teacherName }}</p>
                <p><strong>选择时间：</strong>{{ selection.createTime }}</p>
              </div>
              <button
                v-if="selection.status === 'pending' && currentStep === 1"
                class="cancel-btn"
                @click="cancelSelection(selection.id)"
                :disabled="loading"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>

        <!-- 等待阶段提示 -->
        <div v-if="currentStep === 0">
          <!-- 教师报名界面 -->
          <div v-if="user?.role === 'teacher'" class="join-section">
            <div class="join-card">
              <h2>双选报名</h2>
              <p class="instruction">请设置您的招生名额并报名参与双选</p>
              <div class="form-row">
                <div class="form-item">
                  <label>最小名额：</label>
                  <input type="number" v-model.number="minQuota" min="0" placeholder="请输入最小名额" />
                </div>
                <div class="form-item">
                  <label>最大名额：</label>
                  <input type="number" v-model.number="maxQuota" min="1" placeholder="请输入最大名额" />
                </div>
              </div>
              <div class="form-actions">
                <button class="join-btn" @click="joinDoubleSelection" :disabled="loading">
                  <span v-if="loading">报名中...</span>
                  <span v-else>报名参与双选</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 学生等待界面 -->
          <div v-else class="waiting-section">
            <div class="waiting-icon">⏳</div>
            <h2>导师双选尚未开始</h2>
            <p>请耐心等待，双选开始后会通知您。</p>
          </div>
        </div>

        <!-- 导师确认阶段提示 -->
        <div class="waiting-section" v-if="currentStep === 2 && mySelections.length > 0">
          <div class="waiting-icon">⏳</div>
          <h2>等待导师确认</h2>
          <p>您已选择导师，正在等待导师确认，请耐心等待。</p>
        </div>

        <!-- 导师视角：学生列表（导师确认阶段） -->
        <div class="students-section" v-if="user?.role === 'teacher' && currentStep === 2">
          <div class="students-header">
            <h2>选择您的学生</h2>
            <p class="instruction">请从列表中选择不超过您名额的学生</p>
            <div class="quota-info" v-if="user">
              <span class="quota-label">当前名额：</span>
              <span class="quota-value">{{ currentTeacherQuota.currentQuota }}/{{ currentTeacherQuota.maxQuota }}</span>
            </div>
          </div>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="students.length === 0" class="no-results">
            暂无学生选择您
          </div>
          <div v-else class="students-grid">
            <div
              v-for="student in students"
              :key="student.id"
              class="student-card"
              :class="{
                'confirmed': student.status === 'confirmed',
                'rejected': student.status === 'rejected',
              }"
            >
              <div class="student-header">
                <h3>{{ student.studentName }}</h3>
                <span class="priority"> 志愿: 第{{ student.priority }}志愿 </span>
              </div>
              <div class="student-info">
                <p><strong>学号：</strong>{{ student.studentId }}</p>
                <p><strong>专业：</strong>{{ student.major || '暂无' }}</p>
              </div>
              <div class="student-actions" v-if="student.status === 'pending'">
                <button
                  class="confirm-btn"
                  @click="confirmStudent(student.id)"
                  :disabled="loading"
                >
                  确认
                </button>
                <button
                  class="reject-btn"
                  @click="rejectStudent(student.id)"
                  :disabled="loading"
                >
                  拒绝
                </button>
              </div>
              <div class="student-actions" v-else-if="student.status === 'rejected'|| student.status === 'confirmed'">
                <button
                  class="revoke-btn"
                  @click="revokeSelection(student.id)"
                  :disabled="loading"
                >
                  撤回选择({{ getStatusText(student.status) }})
                </button>
              </div>
              <span v-else-if="student.status === 'rejected'" class="status-tag rejected">
                已拒绝
              </span>
            </div>
          </div>
        </div>

        <!-- 教师视角：学生选导师阶段等待界面 -->
        <div class="waiting-section" v-if="user?.role === 'teacher' && currentStep === 1">
          <div class="waiting-icon">⏳</div>
          <h2>等待学生选择</h2>
          <p>当前处于学生选导师阶段，请耐心等待学生选择。</p>
        </div>

        <!-- 教师视角：双选完成阶段的学生列表 -->
        <div class="students-section" v-if="user?.role === 'teacher' && currentStep === 3">
          <div class="students-header">
            <h2>已分配的学生</h2>
            <p class="instruction">您已确认的学生列表</p>
            <div class="quota-info">
              <span class="quota-label">当前名额：</span>
              <span class="quota-value">{{ students.length }}/{{ currentTeacherQuota.maxQuota }}</span>
            </div>
          </div>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="students.length === 0" class="no-results">
            暂无学生选择您
          </div>
          <div v-else class="students-grid">
            <div
              v-for="student in students"
              :key="student.studentId"
              class="student-card confirmed"
            >
              <div class="student-header">
                <h3>{{ student.studentName }}</h3>
                <span class="priority"> 学号: {{ student.studentUsername }} </span>
              </div>
              <div class="student-info">
                <p><strong>专业：</strong>{{ student.major || '暂无' }}</p>
              </div>
              <div class="student-actions">
                <span class="status-tag confirmed">已确认</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体布局 */
.double-selection {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin-top: 150px;
}

/* 布局容器 */
.layout-container {
  display: flex;
  gap: 20px;
  min-height: 600px;
  width: 100%;
}

/* 左侧面板 */
.left-panel {
  width: 200px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
  width: 800px
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .right-panel {
    width: 100%;
  }
}

/* 阶段指示器 */
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.step {
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: flex-start;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.step.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.step.current .step-number {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 87, 108, 0);
  }
}

.step-text {
  font-size: 13px;
  color: #888;
  font-weight: 500;
  transition: all 0.3s ease;
  flex: 1;
}

.step.active .step-text {
  color: #667eea;
  font-weight: 600;
}

.step.current .step-text {
  color: #f5576c;
  font-weight: 700;
}

.step-line {
  width: 3px;
  height: 40px;
  background: #e0e0e0;
  border-radius: 2px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.step-line.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.step-line.active::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% {
    top: 100%;
  }
}

/* 消息提示 */
.error-message {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(238, 90, 90, 0.3);
  animation: slideIn 0.3s ease;
}

.success-message {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(64, 192, 87, 0.3);
  animation: slideIn 0.3s ease;
}

/* 时间信息区域 */
.time-info {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 20px auto;
  padding: 15px 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(66, 165, 245, 0.2);
  text-align: center;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 完成提示 */
.completed-section {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(64, 192, 87, 0.3);
}

.success-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.completed-section h2 {
  margin-bottom: 10px;
  font-size: 20px;
}

.completed-section p {
  margin: 8px 0;
  font-size: 14px;
}

/* 导师列表 */
.teachers-section {
  margin-bottom: 30px;
}

.teachers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.teachers-header h2 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
  margin: 0;
}

.teachers-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

/* 搜索功能 */
.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* 无结果提示 */
.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 12px;
  margin: 20px 0;
}

/* 分页功能 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.page-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e0e0e0;
  box-shadow: none;
}

.page-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.teacher-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.teacher-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.teacher-card.selected {
  border-color: #51cf66;
  background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
}

.teacher-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.teacher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.teacher-header h3 {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.quota {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.teacher-info {
  margin-bottom: 15px;
}

.teacher-info p {
  margin: 6px 0;
  color: #555;
  font-size: 14px;
}

.teacher-info strong {
  color: #2c3e50;
  font-weight: 600;
}

.teacher-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.select-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.select-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.select-btn.secondary {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 2px 10px rgba(118, 75, 162, 0.3);
}

.select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-options {
  display: flex;
  gap: 10px;
}

.select-options .select-btn {
  flex: 1;
}

.selected-tag {
  padding: 8px 16px;
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  text-align: center;
}

.full-tag {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  text-align: center;
}

/* 选择状态 */
.status-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  border: 2px solid #c7d2fe;
}

.status-card h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #c7d2fe;
  font-size: 18px;
  font-weight: 600;
}

.selections-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.choice-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.choice-card.first-choice {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
}

.choice-card.second-choice {
  border-color: #764ba2;
  background: linear-gradient(135deg, #f5f3ff 0%, #ebe5ff 100%);
}

.choice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.choice-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.status.pending {
  background: linear-gradient(135deg, #ffd93d 0%, #f6ad55 100%);
  color: #744210;
}

.status.confirmed {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
}

.status.rejected {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

.choice-info p {
  margin: 6px 0;
  color: #555;
  font-size: 14px;
}

.choice-info strong {
  color: #2c3e50;
  font-weight: 600;
}

.cancel-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(238, 90, 90, 0.3);
}

.cancel-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 90, 90, 0.4);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 等待提示 */
.waiting-section {
  background: linear-gradient(135deg, #ffd93d 0%, #f6ad55 100%);
  color: #744210;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(246, 173, 85, 0.3);
}

.waiting-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.waiting-section h2 {
  margin-bottom: 10px;
  font-size: 20px;
  color: #744210;
}

.waiting-section p {
  margin: 8px 0;
  font-size: 14px;
  color: #744210;
}

/* 报名界面 */
.join-section {
  margin-top: 20px;
}

.join-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #c7d2fe;
}

.join-card h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.join-card .instruction {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
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
  justify-content: center;
  margin-top: 20px;
}

.join-btn {
  padding: 12px 30px;
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

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
}

/* 标题样式 */
h1 {
  text-align: center;
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
  position: relative;
  padding-bottom: 12px;
}

h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

h2 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
}

/* 学生列表 */
.students-section {
  margin-bottom: 30px;
}

.students-header {
  margin-bottom: 20px;
}

.students-header h2 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
  margin: 0 0 10px 0;
}

.students-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.students-header .instruction {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px 0;
  padding-left: 12px;
}

.quota-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 12px;
  margin-bottom: 20px;
}

.quota-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.quota-value {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.student-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.student-card.confirmed {
  border-color: #51cf66;
  background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
}

.student-card.rejected {
  border-color: #ff6b6b;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.student-header h3 {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.priority {
  background: linear-gradient(135deg, #ffd93d 0%, #f6ad55 100%);
  color: #744210;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.student-info {
  margin-bottom: 15px;
}

.student-info p {
  margin: 6px 0;
  color: #555;
  font-size: 14px;
}

.student-info strong {
  color: #2c3e50;
  font-weight: 600;
}

.student-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(64, 192, 87, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(64, 192, 87, 0.4);
}

.reject-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(238, 90, 90, 0.3);
}

.reject-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(238, 90, 90, 0.4);
}

.revoke-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ffd93d 0%, #f6ad55 100%);
  color: #744210;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(246, 173, 85, 0.3);
}

.revoke-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(246, 173, 85, 0.4);
}

.confirm-btn:disabled,
.reject-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-tag {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  width: 100%;
}

.status-tag.confirmed {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
}

.status-tag.rejected {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

/* 通用样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}
</style>
