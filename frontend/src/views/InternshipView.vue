<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const activeMenu = ref('实习公告')

// 角色判断
const isTeacher = computed(() => user.value?.role === 'teacher')
const isStudent = computed(() => user.value?.role === 'student')
const isAdmin = computed(() => user.value?.role === 'admin')
const isCompany = computed(() => user.value?.role === 'company')

// 菜单项定义
const menuItems = ref([
  { name: '实习公告', category: '实习管理' },
  { name: '实习报名', category: '实习管理' },
  { name: '我的实习', category: '实习管理' },
  { name: '实习评价', category: '实习管理' },
])

// 检查学生是否有实习企业
const hasInternshipCompany = computed(() => {
  return myInternships.value.some(app => app.status === 'confirmed')
})

const adminMenuItems = ref([
  ...menuItems.value,
  { name: '实习单位管理', category: '实习管理' },
  { name: '实习审核', category: '实习管理' },
])

const teacherMenuItems = ref([
  ...menuItems.value,
  { name: '实习审核', category: '实习管理' },
])

const studentMenuItems = computed(() => {
  const baseItems = [...menuItems.value]
  // 只有当学生有确认的实习时才添加"我的日志"菜单
  if (hasInternshipCompany.value) {
    baseItems.push({ name: '我的日志', category: '实习管理' })
  }
  return baseItems
})

// 企业用户菜单项
const companyMenuItems = ref([
  { name: '实习公告', category: '实习管理' },
  { name: '实习审核', category: '实习管理' },
])

// 广告牌轮播数据
const carouselSlides = ref([
  { id: 1, title: '实习招募', description: '2026 年暑期实习岗位火热招募中' },
  { id: 2, title: '校企合作', description: '与多家知名企业建立实习基地' },
  { id: 3, title: '就业指导', description: '提供专业职业规划和就业指导' },
  { id: 4, title: '实践机会', description: '丰富的实践机会，提升专业技能' },
])

const currentSlide = ref(0)
const carouselTimer = ref<any>(null)

// 实习列表数据
const internships = ref<any[]>([])
// 实习申请数据（企业审核用）
const internshipApplications = ref<any[]>([])

// 获取实习招聘列表
const getInternships = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/internship/list'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      internships.value = result.internships
    } else {
      errorMessage.value = result.message || '获取实习列表失败'
    }
  } catch (error) {
    console.error('获取实习列表失败', error)
    errorMessage.value = '获取实习列表失败，请稍后重试'
  }
}

// 我的实习数据
const myInternships = ref([])

// 获取学生实习申请列表
const getStudentApplications = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/student/applications'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      myInternships.value = result.applications
    } else {
      errorMessage.value = result.message || '获取申请列表失败'
    }
  } catch (error) {
    console.error('获取申请列表失败', error)
    errorMessage.value = '获取申请列表失败，请稍后重试'
  }
}

// 打开确认弹窗
const openConfirmDialog = (applicationId) => {
  selectedApplicationId.value = applicationId
  showConfirmDialog.value = true
}

// 确认实习
const confirmInternship = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/student/confirm-internship'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_id: selectedApplicationId.value
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = result.message
      // 关闭弹窗
      showConfirmDialog.value = false
      // 重新获取申请列表
      getStudentApplications()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || '确认失败'
    }
  } catch (error) {
    console.error('确认失败', error)
    errorMessage.value = '确认失败，请稍后重试'
  }
}

// 实习单位数据
const companies = ref([
  { id: 1, name: '某某科技有限公司', contact: '张三', phone: '010-12345678', email: 'hr@company1.com', address: '北京市海淀区' },
  { id: 2, name: '某某网络公司', contact: '李四', phone: '021-87654321', email: 'hr@company2.com', address: '上海市浦东新区' },
])

// 评价表单
const evaluationForm = ref({
  company: '',
  position: '',
  summary: '',
  rating: '5',
})

// 获取已确认的实习信息
const confirmedInternship = computed(() => {
  return myInternships.value.find(app => app.status === 'confirmed')
})

// 添加实习单位弹窗
const showAddCompany = ref(false)
const newCompany = ref({
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
})

// 确认实习弹窗
const showConfirmDialog = ref(false)
const selectedApplicationId = ref(0)

// 公告数据
const announcements = ref([
  { id: 1, title: '2025 年暑期实习开始报名', content: '各位同学，2025 年暑期实习报名已经开始，请登录系统进行报名。', date: '2025-03-15' },
  { id: 2, title: '实习安全注意事项', content: '实习期间请注意人身和财产安全，遵守实习单位的规章制度。', date: '2025-03-10' },
])

// 广告牌轮播逻辑
const startCarousel = () => {
  carouselTimer.value = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % carouselSlides.value.length
  }, 5000) // 每 5 秒切换一次
}

const stopCarousel = () => {
  if (carouselTimer.value) {
    clearInterval(carouselTimer.value)
  }
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  stopCarousel()
  startCarousel()
}

const carouselStyle = computed(() => ({
  transform: `translateX(-${currentSlide.value * 100}%)`,
}))

// 获取用户信息
const getUserInfo = async () => {
  const token = sessionStorage.getItem('token')
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
      router.push('/login')
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    router.push('/login')
  }
}

// 处理菜单点击
const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
  // 如果点击的是实习审核，获取申请列表
  if (item.name === '实习审核') {
    getCompanyApplications()
  }
  // 如果点击的是我的日志，获取日志列表
  if (item.name === '我的日志') {
    getStudentLogs()
  }
}

// 报名实习
const showApplyDialog = ref(false)
const currentInternshipId = ref(0)
const resumeFile = ref<File | null>(null)

const applyInternship = (id: number) => {
  currentInternshipId.value = id
  showApplyDialog.value = true
}

const handleResumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    resumeFile.value = target.files[0]
  }
}

const submitApplication = async () => {
  if (!resumeFile.value) {
    errorMessage.value = '请上传简历'
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('resume', resumeFile.value)
    formData.append('internship_id', currentInternshipId.value.toString())

    const response = await fetch(buildURL('/api/internship/apply'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      const internship = internships.value.find(i => i.id === currentInternshipId.value)
      if (internship) {
        internship.registered = true
        internship.registeredCount += 1
      }
      showApplyDialog.value = false
      resumeFile.value = null
      successMessage.value = '报名成功'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || '报名失败'
    }
  } catch (error) {
    console.error('报名失败', error)
    errorMessage.value = '报名失败，请稍后重试'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: any = {
    confirmed: '已确认',
    pending: '待审核',
    rejected: '已拒绝',
    approved: '已同意',
    completed: '已完成',
  }
  return statusMap[status] || status
}

// 添加实习单位
const addCompany = () => {
  companies.value.push({
    id: companies.value.length + 1,
    ...newCompany.value,
  })
  showAddCompany.value = false
  newCompany.value = {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
  }
  successMessage.value = '添加成功'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 提交评价
const submitEvaluation = () => {
  if (confirmedInternship.value) {
    // 使用已确认实习的信息
    evaluationForm.value.company = confirmedInternship.value.company
    evaluationForm.value.position = confirmedInternship.value.position
  }
  successMessage.value = '评价提交成功'
  evaluationForm.value = {
    company: '',
    position: '',
    summary: '',
    rating: '5',
  }
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 日志相关
const logs = ref<any[]>([])
const logForm = ref({
  content: '',
  date: new Date().toISOString().split('T')[0],
  file: null as File | null
})
const showLogDialog = ref(false)
const editingLogId = ref(null)
const isEditing = ref(false)

// 获取学生日志列表
const getStudentLogs = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/student/logs'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      logs.value = result.logs
    } else {
      errorMessage.value = result.message || '获取日志列表失败'
    }
  } catch (error) {
    console.error('获取日志列表失败', error)
    errorMessage.value = '获取日志列表失败，请稍后重试'
  }
}

// 处理日志文件上传
const handleLogFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    logForm.value.file = target.files[0]
  }
}

// 提交日志
const submitLog = async () => {
  if (!logForm.value.content) {
    errorMessage.value = '请输入日志内容'
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('content', logForm.value.content)
    formData.append('date', logForm.value.date)
    if (logForm.value.file) {
      formData.append('file', logForm.value.file)
    }

    let url = buildURL('/api/student/logs')
    let method = 'POST'

    // 如果是编辑模式
    if (isEditing.value && editingLogId.value) {
      url = buildURL(`/api/student/logs/${editingLogId.value}`)
      method = 'PUT'
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = isEditing.value ? '日志编辑成功' : '日志提交成功'
      showLogDialog.value = false
      logForm.value = {
        content: '',
        date: new Date().toISOString().split('T')[0],
        file: null
      }
      isEditing.value = false
      editingLogId.value = null
      // 重新获取日志列表
      getStudentLogs()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || (isEditing.value ? '编辑失败' : '提交失败')
    }
  } catch (error) {
    console.error(isEditing.value ? '编辑失败' : '提交失败', error)
    errorMessage.value = isEditing.value ? '编辑失败，请稍后重试' : '提交失败，请稍后重试'
  }
}

// 编辑日志
const editLog = (log) => {
  // 检查是否是最新的日志
  if (logs.value.length > 0) {
    const latestLog = logs.value[0] // 假设日志是按日期降序排序的
    if (latestLog.id !== log.id) {
      errorMessage.value = '只能编辑最新发布的日志'
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      return
    }
  }

  // 填充表单
  logForm.value = {
    content: log.content,
    date: log.date,
    file: null
  }
  editingLogId.value = log.id
  isEditing.value = true
  showLogDialog.value = true
}

// 分页相关
const currentPage = ref(1)
const itemsPerPage = ref(1)
const totalPages = computed(() => {
  return Math.ceil(internshipApplications.value.length / itemsPerPage.value)
})

// 当前显示的申请
const currentApplication = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  return internshipApplications.value[startIndex]
})

// 翻页
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 获取企业实习申请列表
const getCompanyApplications = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/company/applications'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      internshipApplications.value = result.applications
      currentPage.value = 1 // 重置到第一页
    } else {
      errorMessage.value = result.message || '获取申请列表失败'
    }
  } catch (error) {
    console.error('获取申请列表失败', error)
    errorMessage.value = '获取申请列表失败，请稍后重试'
  }
}

// 获取token
const getToken = () => {
  return sessionStorage ? sessionStorage.getItem('token') : ''
}

// 审核实习申请
const reviewApplication = async (applicationId: number, action: 'approve' | 'reject') => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/company/application/process'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_id: applicationId,
        action: action
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = '审核成功'
      // 重新获取申请列表
      getCompanyApplications()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || '审核失败'
    }
  } catch (error) {
    console.error('审核失败', error)
    errorMessage.value = '审核失败，请稍后重试'
  }
}

// 编辑实习单位
const editCompany = (company: any) => {
  // TODO: 实现编辑功能
  console.log('编辑公司', company)
}

// 删除实习单位
const deleteCompany = (id: number) => {
  // TODO: 实现删除功能
  console.log('删除公司', id)
}

onMounted(async () => {
  await getUserInfo()
  startCarousel()
  getInternships()
  // 如果是学生，获取实习申请列表
  if (isStudent.value) {
    await getStudentApplications()
    // 如果有确认的实习，获取日志列表
    if (hasInternshipCompany.value) {
      getStudentLogs()
    }
  }
})
</script>


<template>
  <div class="internship-view">
    <!-- 标题区域 -->
    <div class="title-section">
      <h1>实习管理</h1>
    </div>

    <!-- 上方滚动广告牌面板 -->
    <div class="top-scroll-panel">
      <div class="carousel-container" :style="carouselStyle">
        <div v-for="(slide, index) in carouselSlides" :key="index" class="carousel-slide">
          <div class="slide-content">
            <h2>{{ slide.title }}</h2>
            <p>{{ slide.description }}</p>
          </div>
        </div>
      </div>
      <!-- 导航点 -->
      <div class="carousel-dots">
        <span
          v-for="(slide, index) in carouselSlides"
          :key="index"
          class="dot"
          :class="{ active: currentSlide === index }"
          @click="goToSlide(index)"
        ></span>
      </div>
    </div>

    <!-- 主要内容区域：1-2 布局 -->
    <div class="main-content">
      <!-- 左侧：标签栏 -->
      <div v-if="user" class="left-panel">
        <div class="menu-section">
          <h3 class="menu-title">实习管理</h3>
          <div
            v-for="item in (user.role === 'admin'
              ? adminMenuItems
              : user.role === 'company'
                ? companyMenuItems
                : isTeacher
                  ? teacherMenuItems
                  : isStudent
                    ? studentMenuItems
                    : menuItems
            ).filter((i) => i.category === '实习管理')"
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
        <!-- 实习公告页面 -->
        <div v-if="activeMenu === '实习公告'" class="content-section">
          <div class="announcement-list">
            <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item">
              <h4>{{ announcement.title }}</h4>
              <p>{{ announcement.content }}</p>
              <span class="announcement-date">{{ announcement.date }}</span>
            </div>
          </div>
        </div>

        <!-- 实习报名页面 -->
        <div v-else-if="activeMenu === '实习报名'" class="content-section">
          <div class="registration-list">
            <table class="internship-table">
              <thead>
              <tr>
                <th>实习单位</th>
                <th>实习岗位</th>
                <th>城市</th>
                <th>具体地点</th>
                <th>薪资</th>
                <th>招聘人数</th>
                <th>已报名人数</th>
                <th>截止日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="internship in internships" :key="internship.id">
                <td>{{ internship.company }}</td>
                <td>
                  <div>{{ internship.position }}</div>
                  <div class="tags">
                    <span v-for="(tag, index) in internship.skillTags" :key="index" class="tag skill-tag">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="tags">
                    <span v-for="(tag, index) in internship.welfareTags" :key="index" class="tag welfare-tag">
                      {{ tag }}
                    </span>
                  </div>
                </td>
                <td>{{ internship.city }}</td>
                <td>{{ internship.location }}</td>
                <td>{{ internship.salary || '面议' }}</td>
                <td>{{ internship.quota }}</td>
                <td>{{ internship.registeredCount }}</td>
                <td>{{ internship.deadline }}</td>
                <td class="operation">
                  <a v-if="!internship.registered" href="#" @click.prevent="applyInternship(internship.id)">报名</a>
                  <span v-else class="registered-badge">已报名</span>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        <!-- 我的实习页面 -->
        <div v-else-if="activeMenu === '我的实习'" class="content-section">
          <div class="my-internship">
            <div v-if="myInternships.length === 0" class="empty-state">
              <p>暂无实习申请</p>
            </div>
            <div v-else class="internship-card-list">
              <div v-for="application in myInternships" :key="application.id" class="internship-card">
                <h4>{{ application.company }} - {{ application.position }}</h4>
                <p><strong>实习地点：</strong>{{ application.location }}</p>
                <p><strong>申请时间：</strong>{{ application.apply_time }}</p>
                <p><strong>状态：</strong><span :class="'status-' + application.status">{{ getStatusText(application.status) }}</span></p>
                <div v-if="application.status === 'approved'" class="card-actions">
                  <button class="primary-btn" @click="openConfirmDialog(application.id)">确认实习</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 实习评价页面 -->
        <div v-else-if="activeMenu === '实习评价'" class="content-section">
          <div class="evaluation-form">
            <h3>提交实习评价</h3>
            <div v-if="confirmedInternship" class="form-row">
              <div class="form-item">
                <label>实习单位：</label>
                <div class="form-value">{{ confirmedInternship.company }}</div>
              </div>
              <div class="form-item">
                <label>实习岗位：</label>
                <div class="form-value">{{ confirmedInternship.position }}</div>
              </div>
            </div>
            <div v-else class="no-internship">
              <p>暂无已确认的实习记录，无法提交评价</p>
            </div>
            <div class="form-row">
              <div class="form-item full-width">
                <label>实习总结：</label>
                <textarea v-model="evaluationForm.summary" placeholder="请输入实习总结" rows="4"></textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>实习评分：</label>
                <select v-model="evaluationForm.rating">
                  <option value="5">优秀</option>
                  <option value="4">良好</option>
                  <option value="3">中等</option>
                  <option value="2">及格</option>
                  <option value="1">不及格</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="submit-btn" @click="submitEvaluation" :disabled="!confirmedInternship">提交评价</button>
            </div>
          </div>
        </div>

        <!-- 实习单位管理页面（管理员） -->
        <div v-else-if="activeMenu === '实习单位管理'" class="content-section">
          <div class="company-management">
            <div class="add-company-btn">
              <button @click="showAddCompany = true">添加实习单位</button>
            </div>
            <table class="internship-table">
              <thead>
                <tr>
                  <th>单位名称</th>
                  <th>联系人</th>
                  <th>联系电话</th>
                  <th>邮箱</th>
                  <th>地址</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="company in companies" :key="company.id">
                  <td>{{ company.name }}</td>
                  <td>{{ company.contact }}</td>
                  <td>{{ company.phone }}</td>
                  <td>{{ company.email }}</td>
                  <td>{{ company.address }}</td>
                  <td class="operation">
                    <a href="#" @click.prevent="editCompany(company)">编辑</a>
                    <a href="#" @click.prevent="deleteCompany(company.id)">删除</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>



        <!-- 实习审核页面（企业） -->
        <div v-else-if="activeMenu === '实习审核'" class="content-section">
          <h3>实习申请审核</h3>

          <!-- 单个申请详情 -->
          <div v-if="currentApplication" class="application-detail">
            <h4>申请详情</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>申请ID：</label>
                <span>{{ currentApplication.id }}</span>
              </div>
              <div class="detail-item">
                <label>学生姓名：</label>
                <span>{{ currentApplication.student_name }}</span>
              </div>
              <div class="detail-item">
                <label>学生专业：</label>
                <span>{{ currentApplication.major || '未设置' }}</span>
              </div>
              <div class="detail-item">
                <label>实习岗位：</label>
                <span>{{ currentApplication.position }}</span>
              </div>
              <div class="detail-item">
                <label>申请时间：</label>
                <span>{{ currentApplication.apply_time }}</span>
              </div>
              <div class="detail-item">
                <label>状态：</label>
                <span :class="'status-' + currentApplication.status">{{ getStatusText(currentApplication.status) }}</span>
              </div>
            </div>

            <!-- 学生简历 -->
            <div class="resume-section">
              <h5>学生简历</h5>
              <div v-if="currentApplication.resume_file" class="resume-content">
                <iframe :src="`${buildURL(`/api/internship/resume/${currentApplication.resume_file}`)}?token=${getToken()}`" width="100%" height="600px" frameborder="0"></iframe>
              </div>
              <div v-else class="empty-resume">
                <p>暂无简历</p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="application-actions" v-if="currentApplication.status === 'pending'">
              <button @click="reviewApplication(currentApplication.id, 'approve')" class="approve-btn">批准</button>
              <button @click="reviewApplication(currentApplication.id, 'reject')" class="reject-btn">拒绝</button>
            </div>
          </div>

          <!-- 分页控件 -->
          <div v-if="totalPages > 1" class="pagination">
            <button @click="goToPage(1)" :disabled="currentPage === 1">首页</button>
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>
            <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">下一页</button>
            <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages">末页</button>
          </div>

          <!-- 无申请时的提示 -->
          <div v-if="internshipApplications.length === 0" class="empty-state">
            <p>暂无实习申请</p>
          </div>
        </div>

        <!-- 我的日志页面 -->
        <div v-else-if="activeMenu === '我的日志'" class="content-section">
          <div class="log-section">
            <div class="log-header">
              <h3>我的工作日志</h3>
              <button class="primary-btn" @click="showLogDialog = true">新建日志</button>
            </div>

            <div v-if="logs.length === 0" class="empty-state">
              <p>暂无工作日志</p>
            </div>
            <div v-else class="log-list">
              <div v-for="log in logs" :key="log.id" class="log-item">
                <div class="log-date">{{ log.date }}</div>
                <div class="log-content">{{ log.content }}</div>
                <div v-if="log.file" class="log-file">
                  <a :href="`${buildURL(`/api/student/logs/file/${log.file}`)}?token=${getToken()}`" target="_blank">查看附件</a>
                </div>
                <div v-if="log.id === logs[0].id" class="log-actions">
                  <button class="edit-btn" @click="editLog(log)">编辑</button>
                </div>
              </div>
            </div>
            <div class="log-tip">
              <p>提示：您只能编辑最新发布的一次日志</p>
            </div>
          </div>
        </div>


      </div>
    </div>

    <!-- 添加实习单位弹窗 -->
    <div v-if="showAddCompany" class="modal-overlay" @click="showAddCompany = false">
      <div class="modal-content" @click.stop>
        <h3>添加实习单位</h3>
        <div class="form-row">
          <div class="form-item">
            <label>单位名称：</label>
            <input type="text" v-model="newCompany.name" placeholder="请输入单位名称" />
          </div>
          <div class="form-item">
            <label>联系人：</label>
            <input type="text" v-model="newCompany.contact" placeholder="请输入联系人" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label>联系电话：</label>
            <input type="text" v-model="newCompany.phone" placeholder="请输入联系电话" />
          </div>
          <div class="form-item">
            <label>邮箱：</label>
            <input type="email" v-model="newCompany.email" placeholder="请输入邮箱" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item full-width">
            <label>地址：</label>
            <input type="text" v-model="newCompany.address" placeholder="请输入地址" />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showAddCompany = false">取消</button>
          <button class="primary-btn" @click="addCompany">保存</button>
        </div>
      </div>
    </div>

    <!-- 投递简历弹窗 -->
    <div v-if="showApplyDialog" class="modal-overlay" @click="showApplyDialog = false">
      <div class="modal-content" @click.stop>
        <h3>投递简历</h3>
        <p>请上传您的简历，我们会尽快审核您的申请。</p>
        <div class="file-upload">
          <input type="file" @change="handleResumeChange" class="file-input" id="resumeInput">
          <label for="resumeInput" class="file-label">
            <span class="upload-icon">📄</span>
            <span v-if="!resumeFile" class="upload-text">点击或拖拽文件到此处上传简历</span>
            <span v-else class="upload-text">已选择：{{ resumeFile.name }}</span>
          </label>
        </div>
        <div class="modal-actions">
          <button @click="showApplyDialog = false">取消</button>
          <button class="primary-btn" @click="submitApplication" :disabled="!resumeFile">提交</button>
        </div>
      </div>
    </div>

    <!-- 确认实习弹窗 -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="showConfirmDialog = false">
      <div class="modal-content" @click.stop>
        <h3>确认实习</h3>
        <p>您确定要确认此实习吗？</p>
        <p class="warning-text">确认后，系统将自动拒绝其他所有已批准的实习申请。</p>
        <div class="modal-actions">
          <button @click="showConfirmDialog = false">取消</button>
          <button class="primary-btn" @click="confirmInternship">确认</button>
        </div>
      </div>
    </div>

    <!-- 新建/编辑日志弹窗 -->
    <div v-if="showLogDialog" class="modal-overlay" @click="showLogDialog = false">
      <div class="modal-content" @click.stop>
        <h3>{{ isEditing ? '编辑工作日志' : '新建工作日志' }}</h3>
        <div class="form-row">
          <div class="form-item">
            <label>日期：</label>
            <input type="date" v-model="logForm.date" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item full-width">
            <label>日志内容：</label>
            <textarea v-model="logForm.content" placeholder="请输入工作日志内容" rows="6"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-item full-width">
            <label>附件（可选）：</label>
            <div class="file-upload">
              <input type="file" @change="handleLogFileChange" class="file-input" id="logFileInput">
              <label for="logFileInput" class="file-label">
                <span class="upload-icon">📄</span>
                <span v-if="!logForm.file" class="upload-text">点击或拖拽文件到此处上传附件</span>
                <span v-else class="upload-text">已选择：{{ logForm.file.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showLogDialog = false; isEditing = false; editingLogId = null">取消</button>
          <button class="primary-btn" @click="submitLog">{{ isEditing ? '保存' : '提交' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.internship-view {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.title-section {
  margin-bottom: 20px;
}

.title-section h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

/* 上方滚动广告牌面板 */
.top-scroll-panel {
  position: relative;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 300px;
}

.carousel-container {
  display: flex;
  transition: transform 0.5s ease-in-out;
  height: 100%;
}

.carousel-slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.slide-content {
  text-align: center;
  padding: 20px;
}

.slide-content h2 {
  margin: 0 0 20px 0;
  font-size: 36px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.slide-content p {
  margin: 0;
  font-size: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* 导航点 */
.carousel-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.8);
}

.dot.active {
  background: white;
  transform: scale(1.2);
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 20px;
  min-height: 600px;
}

/* 左侧标签栏 */
.left-panel {
  width: 200px;
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.menu-section {
  margin-bottom: 20px;
}

.menu-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.menu-item {
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin-bottom: 5px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item.active {
  background-color: #409eff;
  color: white;
}

.menu-text {
  font-size: 14px;
}

.loading-panel {
  width: 200px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 右侧内容区域 */
.right-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.content-section {
  min-height: 500px;
}

.evaluation-form {
  background-color: #ffffff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
}

.evaluation-form h3 {
  margin: 0 0 24px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

/* 表格样式 */
.internship-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed; /* 固定表格布局 */
  min-width: 1000px;
}

.internship-table th,
.internship-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e6e6e6;
  vertical-align: top;
  white-space: normal;
  word-wrap: break-word;
  height: 100%;
}

/* 固定列宽设置 */
.internship-table th:nth-child(1),
.internship-table td:nth-child(1) {
  width: 150px; /* 实习单位 */
  min-width: 150px;
  max-width: 150px;
}

.internship-table th:nth-child(2),
.internship-table td:nth-child(2) {
  width: 300px; /* 实习岗位 + 标签 */
  min-width: 300px;
  max-width: 300px;
}

.internship-table th:nth-child(3),
.internship-table td:nth-child(3) {
  width: 80px; /* 城市 */
  min-width: 80px;
  max-width: 80px;
}

.internship-table th:nth-child(4),
.internship-table td:nth-child(4) {
  width: 150px; /* 具体地点 */
  min-width: 150px;
  max-width: 150px;
}

.internship-table th:nth-child(5),
.internship-table td:nth-child(5) {
  width: 100px; /* 薪资 */
  min-width: 100px;
  max-width: 100px;
}

.internship-table th:nth-child(6),
.internship-table td:nth-child(6) {
  width: 80px; /* 招聘人数 */
  min-width: 80px;
  max-width: 80px;
}

.internship-table th:nth-child(7),
.internship-table td:nth-child(7) {
  width: 100px; /* 已报名人数 */
  min-width: 100px;
  max-width: 100px;
}

.internship-table th:nth-child(8),
.internship-table td:nth-child(8) {
  width: 120px; /* 截止日期 */
  min-width: 120px;
  max-width: 120px;
}

.internship-table th:nth-child(9),
.internship-table td:nth-child(9) {
  width: 80px; /* 操作 */
  min-width: 80px;
  max-width: 80px;
  white-space: nowrap;
  vertical-align: bottom; /* 底部对齐 */
}

/* 审核表格列宽 */
.internship-table th:nth-child(1),
.internship-table td:nth-child(1) {
  width: 80px; /* 申请ID */
  min-width: 80px;
  max-width: 80px;
}

.internship-table th:nth-child(2),
.internship-table td:nth-child(2) {
  width: 120px; /* 学生姓名 */
  min-width: 120px;
  max-width: 120px;
}

.internship-table th:nth-child(3),
.internship-table td:nth-child(3) {
  width: 120px; /* 学生学号 */
  min-width: 120px;
  max-width: 120px;
}

.internship-table th:nth-child(4),
.internship-table td:nth-child(4) {
  width: 180px; /* 实习岗位 */
  min-width: 180px;
  max-width: 180px;
}

.internship-table th:nth-child(5),
.internship-table td:nth-child(5) {
  width: 150px; /* 申请时间 */
  min-width: 150px;
  max-width: 150px;
}

.internship-table th:nth-child(6),
.internship-table td:nth-child(6) {
  width: 100px; /* 状态 */
  min-width: 100px;
  max-width: 100px;
}

.internship-table th:nth-child(7),
.internship-table td:nth-child(7) {
  width: 120px; /* 操作 */
  min-width: 120px;
  max-width: 120px;
}

.internship-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.internship-table tbody tr {
  height: 120px; /* 固定行高，确保每条记录等宽 */
  min-height: 120px;
  max-height: 120px;
}

.internship-table tbody tr:hover {
  background-color: #f5f7fa;
}

.operation {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  padding: 15px;
  flex-wrap: nowrap;
}

.log-file a {
  color: #409eff;
  text-decoration: none;
}

.log-file a:hover {
  text-decoration: underline;
}

.log-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.edit-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.edit-btn:hover {
  background-color: #66b1ff;
}

.log-tip {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9eb;
  border: 1px solid #e1f5c4;
  border-radius: 4px;
  color: #67c23a;
  font-size: 14px;
}

.registered-badge {
  color: #909399;
  font-size: 13px;
}

/* 卡片列表 */
.internship-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.internship-card {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.internship-card h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.internship-card p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.status-confirmed {
  color: #67c23a;
  font-weight: bold;
}

.status-pending {
  color: #e6a23c;
  font-weight: bold;
}

.status-rejected {
  color: #f56c6c;
  font-weight: bold;
}

.status-completed {
  color: #409eff;
  font-weight: bold;
}

/* 表单样式 */
.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 250px;
}

.form-item.full-width {
  flex: 100%;
}

.form-item label {
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-value {
  width: 100%;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 14px;
  background-color: #f8f9fa;
  color: #333;
  font-weight: 500;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.form-value:hover {
  background-color: #f0f2f5;
  border-color: #c0c4cc;
}

.no-internship {
  padding: 24px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  color: #f56c6c;
  margin-bottom: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.1);
}

.no-internship p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-item textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.form-item select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23909399' d='M6 9L1 4h10L6 9z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.submit-btn {
  padding: 12px 32px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.submit-btn:hover:not(:disabled) {
  background-color: #66b1ff;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.submit-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
}

/* 审核按钮样式 */
.approve-btn {
  padding: 6px 12px;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
}

.approve-btn:hover {
  background-color: #85ce61;
}

.reject-btn {
  padding: 6px 12px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.reject-btn:hover {
  background-color: #f78989;
}

/* 查看按钮样式 */
.view-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.view-btn:hover {
  background-color: #66b1ff;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

.pagination button {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.pagination button:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.pagination button:disabled {
  cursor: not-allowed;
  color: #c0c4cc;
  border-color: #ebeef5;
}

/* 申请详情样式 */
.application-detail {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.application-detail h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 500;
  margin-bottom: 5px;
  color: #606266;
}

.detail-item span {
  color: #303133;
}

/* 简历部分 */
.resume-section {
  margin-top: 20px;
  border-top: 1px solid #e6e6e6;
  padding-top: 20px;
}

.resume-section h5 {
  margin: 0 0 15px 0;
  color: #333;
}

.resume-content {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
}

.empty-resume {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  color: #909399;
}

/* 申请操作按钮 */
.application-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  border-top: 1px solid #e6e6e6;
  padding-top: 20px;
}

.application-actions .approve-btn,
.application-actions .reject-btn {
  padding: 10px 20px;
  font-size: 14px;
}

/* 表格行激活状态 */
.internship-table tr.active {
  background-color: #ecf5ff;
}

/* 边距 */
.mb-20 {
  margin-bottom: 20px;
}



/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 600px;
  max-width: 90%;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.primary-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-btn:hover {
  background-color: #66b1ff;
}

.modal-actions button {
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.primary-btn {
  background-color: #409eff;
  color: white;
  border: none;
}

.primary-btn:hover {
  background-color: #66b1ff;
}

/* 确保primary-btn在弹窗中正确显示 */
.modal-actions .primary-btn {
  background-color: #409eff;
  color: white;
  border: none;
}

.modal-actions .primary-btn:hover {
  background-color: #66b1ff;
}

.modal-actions .primary-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

/* 标签样式 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  max-height: 60px; /* 限制标签区域高度 */
  overflow: hidden;
}

.tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.skill-tag {
  background: #e6f7ff;
  color: #1890ff;
}

.welfare-tag {
  background: #f6ffed;
  color: #52c41a;
}

/* 文件上传样式 */
.file-upload {
  border: 2px dashed #409eff;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  margin: 20px 0;
}

.file-upload:hover {
  border-color: #66b1ff;
  background: #f5f7fa;
}

.file-input {
  display: none;
}

.file-label {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.file-label:hover {
  background: rgba(64, 158, 255, 0.1);
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
  color: #409eff;
}

.upload-text {
  display: block;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 卡片操作按钮 */
.card-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.card-actions .primary-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* 警告文本 */
.warning-text {
  color: #e6a23c;
  font-weight: 500;
  margin-top: 10px;
}

/* 确认弹窗样式 */
.modal-content h3 {
  margin-bottom: 20px;
}

.modal-content p {
  margin-bottom: 10px;
  line-height: 1.5;
}

/* 添加公司按钮 */
.add-company-btn {
  margin-bottom: 20px;
}

.add-company-btn button {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-company-btn button:hover {
  background-color: #66b1ff;
}

/* 日志相关样式 */
.log-section {
  padding: 20px 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-header h3 {
  margin: 0;
  color: #333;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #409eff;
}

.log-date {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  font-size: 14px;
}

.log-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.log-file {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e6e6e6;
}

.log-file a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.log-file a:hover {
  text-decoration: underline;
}

/* 公告列表 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcement-item {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.announcement-item h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.announcement-item p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.6;
}

.announcement-date {
  color: #999;
  font-size: 13px;
}

/* 企业审核样式 */
.approve-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.reject-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.approve-btn:hover {
  background-color: #45a049;
}

.reject-btn:hover {
  background-color: #da190b;
}
</style>
