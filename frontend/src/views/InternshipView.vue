<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const route = useRoute()
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
  { name: '实习报名', category: '实习管理' },
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

// 搜索关键词
const searchKeyword = ref('')

// 收藏功能
const showFavoritesOnly = ref(false)
const favoriteInternshipIds = ref<Set<number>>(new Set())

// 过滤后的实习列表
const filteredInternships = computed(() => {
  let result = internships.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => {
      return (
        (item.company && item.company.toLowerCase().includes(keyword)) ||
        (item.position && item.position.toLowerCase().includes(keyword)) ||
        (item.city && item.city.toLowerCase().includes(keyword)) ||
        (item.location && item.location.toLowerCase().includes(keyword)) ||
        (item.skillTags && item.skillTags.some((tag: string) => tag.toLowerCase().includes(keyword))) ||
        (item.welfareTags && item.welfareTags.some((tag: string) => tag.toLowerCase().includes(keyword)))
      )
    })
  }

  // 收藏过滤
  if (showFavoritesOnly.value && isStudent.value) {
    result = result.filter(item => favoriteInternshipIds.value.has(item.id))
  }

  return result
})

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

      // 如果是学生用户，加载收藏状态
      if (isStudent.value) {
        getStudentFavorites()
      }
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

// 跳转到实习详情页
const goToDetail = (id: number) => {
  router.push(`/internship/detail/${id}`)
}

// 收藏/取消收藏实习
const toggleFavorite = async (id: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const isFavorited = favoriteInternshipIds.value.has(id)

    const response = await fetch(buildURL(`/api/student/favorite/${id}`), {
      method: isFavorited ? 'DELETE' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      if (isFavorited) {
        favoriteInternshipIds.value.delete(id)
        successMessage.value = '已取消收藏'
      } else {
        favoriteInternshipIds.value.add(id)
        successMessage.value = '收藏成功'
      }
      // 更新实习列表中的收藏状态
      const internship = internships.value.find(item => item.id === id)
      if (internship) {
        internship.isFavorited = !isFavorited
      }
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    } else {
      errorMessage.value = result.message || '操作失败'
    }
  } catch (error) {
    console.error('收藏操作失败', error)
    errorMessage.value = '操作失败，请稍后重试'
  }
}

// 获取学生收藏的实习列表
const getStudentFavorites = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/student/favorites'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      favoriteInternshipIds.value = new Set(result.favorites.map((id: number) => id))
      // 更新实习列表中的收藏状态
      internships.value.forEach(item => {
        item.isFavorited = favoriteInternshipIds.value.has(item.id)
      })
    }
  } catch (error) {
    console.error('获取收藏列表失败', error)
  }
}

// 检查学生是否已有确认的实习记录
const checkHasConfirmedInternship = async (): Promise<boolean> => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/student/has-confirmed-internship'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    return result.has_confirmed || false
  } catch (error) {
    console.error('检查实习记录失败', error)
    return false
  }
}

const applyInternship = async (id: number) => {
  // 先检查是否已有确认的实习记录
  const hasConfirmed = await checkHasConfirmedInternship()
  if (hasConfirmed) {
    alert('您已有一份已确认的实习记录，不能再申请其他实习')
    return
  }

  currentInternshipId.value = id
  showApplyDialog.value = true
}

const handleResumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    // 验证文件类型（只允许pdf和docx）
    const allowedTypes = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    // 只允许pdf和docx格式
    if (!allowedTypes.includes(file.type) && !['pdf', 'docx'].includes(fileExtension || '')) {
      errorMessage.value = '请上传PDF或DOCX格式的简历文件，不支持DOC格式'
      resumeFile.value = null
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      return
    }

    // 特别提示：不支持doc格式
    if (fileExtension === 'doc') {
      errorMessage.value = '不支持DOC格式，请使用DOCX或PDF格式'
      resumeFile.value = null
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      return
    }

    resumeFile.value = file
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

// 检查今日是否已发布日志
const hasLogToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return logs.value.some(log => log.date === today)
})

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

  // 非编辑模式下，检查今日是否已发布日志
  if (!isEditing.value && hasLogToday.value) {
    errorMessage.value = '今日已发布过日志，一天只能发布一次'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('content', logForm.value.content)
    // 锁定日期为当前日期
    const today = new Date().toISOString().split('T')[0]
    formData.append('date', today)
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

// 实习申请分页相关
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

// 实习列表分页相关
const internshipListPage = ref(1)
const internshipItemsPerPage = ref(9)
const internshipTotalPages = computed(() => {
  return Math.ceil(filteredInternships.value.length / internshipItemsPerPage.value)
})

// 当前页的实习列表
const currentInternships = computed(() => {
  const startIndex = (internshipListPage.value - 1) * internshipItemsPerPage.value
  const endIndex = startIndex + internshipItemsPerPage.value
  return filteredInternships.value.slice(startIndex, endIndex)
})

// 实习列表翻页
const goToInternshipPage = (page: number) => {
  if (page >= 1 && page <= internshipTotalPages.value) {
    internshipListPage.value = page
  }
}

// Word文档内容预览
const wordContent = ref('')
const loadingWordContent = ref(false)

// 获取Word文档内容
const getWordContent = async (filename: string) => {
  // .doc格式不支持在线预览
  if (!filename || (!filename.toLowerCase().endsWith('.doc') && !filename.toLowerCase().endsWith('.docx'))) {
    wordContent.value = ''
    return
  }

  // .doc格式不支持在线预览
  if (filename.toLowerCase().endsWith('.doc')) {
    wordContent.value = ''
    loadingWordContent.value = false
    return
  }

  loadingWordContent.value = true
  wordContent.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/internship/resume/text/${filename}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      wordContent.value = result.content
    }
  } catch (error) {
    console.error('获取Word文档内容失败', error)
  } finally {
    loadingWordContent.value = false
  }
}

// 监听当前申请变化，获取Word文档内容
watch(currentApplication, (newVal) => {
  if (newVal && newVal.resume_file) {
    if (newVal.resume_file.toLowerCase().endsWith('.doc') ||
        newVal.resume_file.toLowerCase().endsWith('.docx')) {
      getWordContent(newVal.resume_file)
    } else {
      wordContent.value = ''
    }
  } else {
    wordContent.value = ''
  }
}, { immediate: true })

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

  // 检查路由参数，设置默认标签栏
  const tab = route.query.tab as string
  if (tab) {
    activeMenu.value = tab
  }

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
          <!-- 搜索框 -->
          <div class="search-section">
            <div class="search-box">
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="搜索实习单位、岗位、城市或标签..."
                class="search-input"
              />
              <button class="search-btn" @click="searchKeyword = searchKeyword.trim()">
                🔍
              </button>
            </div>
            <div class="filter-options" v-if="isStudent">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showFavoritesOnly" />
                <span class="checkbox-text">仅显示已收藏</span>
              </label>
            </div>
            <div class="search-result-count">
              共找到 {{ filteredInternships.length }} 条实习信息
            </div>
          </div>
          <div class="registration-list">
            <div class="internship-card-grid">
              <div v-for="internship in currentInternships" :key="internship.id" class="internship-card">
                <div class="card-header">
                  <div class="card-title-row">
                    <h3 class="card-title">{{ internship.position }}</h3>
                    <div class="card-header-actions">
                      <button v-if="isStudent" class="favorite-btn" :class="{ favorited: internship.isFavorited }" @click.stop="toggleFavorite(internship.id)" :title="internship.isFavorited ? '取消收藏' : '收藏'">
                        {{ internship.isFavorited ? '★' : '☆' }}
                      </button>
                      <span v-if="internship.status === 'active'" class="status-badge status-active">招聘中</span>
                      <span v-else-if="internship.status === 'closed'" class="status-badge status-closed">已关闭</span>
                    </div>
                  </div>
                </div>
                <div class="card-content">
                  <div class="info-tags">
                    <span class="info-tag">{{ internship.city }}</span>
                    <span class="info-tag">{{ internship.experienceRequirement || '经验不限' }}</span>
                    <span class="info-tag">{{ internship.educationRequirement || '学历不限' }}</span>
                    <span v-if="internship.salary" class="info-tag salary-tag">{{ internship.salary }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <div class="company-info">
                    <div class="company-logo">{{ internship.company.charAt(0) }}</div>
                    <div class="company-details">
                      <div class="company-name">{{ internship.company }}</div>
                      <div class="company-meta">
                        <span v-if="internship.companyField">{{ internship.companyField }}</span>
                        <span v-if="internship.companyScale"> · {{ internship.companyScale }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="card-actions">
                    <a v-if="!internship.registered && isStudent" href="#" @click.prevent="applyInternship(internship.id)" class="card-btn apply-btn">报名</a>
                    <span v-else-if="isCompany" class="card-badge">企业用户</span>
                    <span v-else-if="internship.registered" class="card-badge registered-badge">已报名</span>
                    <a href="#" @click.prevent="goToDetail(internship.id)" class="card-btn detail-btn">查看详情</a>
                  </div>
                </div>
              </div>
            </div>
            <!-- 无搜索结果提示 -->
            <div v-if="filteredInternships.length === 0" class="empty-state">
              <p>暂无匹配的实习信息</p>
            </div>
            <!-- 分页控件 -->
            <div v-if="internshipTotalPages.value > 1" class="pagination">
              <button
                class="pagination-btn"
                :disabled="internshipListPage.value === 1"
                @click="goToInternshipPage(internshipListPage.value - 1)"
              >
                上一页
              </button>
              <span class="pagination-info">
                第 {{ internshipListPage.value }} / {{ internshipTotalPages.value }} 页
              </span>
              <button
                class="pagination-btn"
                :disabled="internshipListPage.value === internshipTotalPages.value"
                @click="goToInternshipPage(internshipListPage.value + 1)"
              >
                下一页
              </button>
            </div>
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
                <!-- PDF文件预览 -->
                <template v-if="currentApplication.resume_file.toLowerCase().endsWith('.pdf')">
                  <div class="resume-preview">
                    <iframe :src="`${buildURL(`/api/internship/resume/${currentApplication.resume_file}`)}?token=${getToken()}`"
                            width="100%"
                            height="800px"
                            frameborder="0">
                    </iframe>
                  </div>
                  <a :href="`${buildURL(`/api/internship/resume/${currentApplication.resume_file}`)}?token=${getToken()}`"
                     download class="download-link">
                    📥 下载简历
                  </a>
                </template>
                <!-- Word文件 -->
                <template v-else-if="currentApplication.resume_file.toLowerCase().endsWith('.doc') ||
                                     currentApplication.resume_file.toLowerCase().endsWith('.docx')">
                  <div class="word-preview">
                    <p>📄 文档类型：Microsoft Word</p>
                    <p>文件名：{{ currentApplication.resume_file }}</p>

                    <!-- Word文档内容预览 -->
                    <div v-if="wordContent" class="word-content-preview">
                      <h6>内容预览：</h6>
                      <pre class="word-text">{{ wordContent }}</pre>
                    </div>
                    <div v-else-if="loadingWordContent" class="loading-indicator">
                      <p>正在加载文档内容...</p>
                    </div>

                    <div class="preview-actions">
                      <a :href="`${buildURL(`/api/internship/resume/${currentApplication.resume_file}`)}?token=${getToken()}`"
                         download class="download-btn">
                        📥 下载文档
                      </a>
                    </div>
                    <p class="word-tip">下载后可使用Microsoft Word或WPS等软件打开查看完整内容</p>
                  </div>
                </template>
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
          <input type="file" @change="handleResumeChange" class="file-input" id="resumeInput" accept=".pdf,.docx">
          <label for="resumeInput" class="file-label">
            <span class="upload-icon">📄</span>
            <span v-if="!resumeFile" class="upload-text">点击或拖拽文件到此处上传简历（支持PDF、DOCX格式）</span>
            <span v-else class="upload-text">已选择：{{ resumeFile.name }}</span>
          </label>
        </div>
        <p class="file-tip">支持上传 PDF (.pdf) 和 DOCX (.docx) 格式的文件，<strong>不支持DOC格式</strong></p>
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
            <input type="date" v-model="logForm.date" readonly class="readonly-input" />
            <span class="input-tip">日期自动锁定为当前日期</span>
          </div>
        </div>
        <div v-if="!isEditing && hasLogToday" class="warning-message">
          <p>⚠️ 今日已发布过日志，一天只能发布一次</p>
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

/* 搜索区域样式 */
.search-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* 筛选选项 */
.filter-options {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #409eff;
}

.checkbox-text {
  font-weight: 500;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px 16px;
  border: 1px solid #e4e7ed;
  flex: 1;
  max-width: 500px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  padding: 10px;
  outline: none;
}

.search-input::placeholder {
  color: #909399;
}

.search-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
}

.search-btn:hover {
  opacity: 0.7;
}

.search-result-count {
  font-size: 14px;
  color: #666;
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

.form-item .readonly-input {
  background: #f5f7fa;
  cursor: not-allowed;
  color: #909399;
}

.form-item .input-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.warning-message {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.warning-message p {
  margin: 0;
  color: #f56c6c;
  font-size: 14px;
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
.empty-resume {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.resume-content {
  margin-top: 10px;
}

.resume-preview {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.word-preview {
  padding: 30px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  text-align: center;
  background: #fafafa;
}

.word-preview p {
  margin-bottom: 20px;
  color: #666;
  font-size: 15px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.download-btn {
  padding: 10px 24px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  display: inline-block;
}

.download-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.word-tip {
  margin-top: 16px;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.word-content-preview {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.word-content-preview h6 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.word-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #444;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading-indicator {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.word-text-empty {
  padding: 16px;
  text-align: center;
  color: #909399;
  background: #fafafa;
  border-radius: 8px;
}

.download-link {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 20px;
  background: #f5f5f5;
  color: #333;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.download-link:hover {
  background: #e8e8e8;
} color: #909399;
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

/* 实习卡片网格布局 */
.internship-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* 实习卡片样式 */
.internship-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.internship-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 卡片头部 */
.card-header {
  margin-bottom: 16px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 收藏按钮 */
.favorite-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #c0c4cc;
  padding: 0;
  transition: all 0.3s;
  line-height: 1;
}

.favorite-btn:hover {
  transform: scale(1.2);
}

.favorite-btn.favorited {
  color: #ffd700;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

/* 状态标签 */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #f0f9ff;
  color: #0066cc;
  border: 1px solid #cce5ff;
}

.status-closed {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

/* 卡片内容 */
.card-content {
  margin-bottom: 20px;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-tag {
  padding: 6px 12px;
  background: #f5f7fa;
  color: #606266;
  border-radius: 6px;
  font-size: 13px;
}

.salary-tag {
  background: #fff7e6;
  color: #fa8c16;
  font-weight: 500;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.company-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.company-details {
  flex: 1;
  min-width: 0;
}

.company-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-meta {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.apply-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.apply-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.detail-btn {
  background: #f5f7fa;
  color: #409eff;
}

.detail-btn:hover {
  background: #ecf5ff;
}

.card-badge {
  padding: 6px 12px;
  font-size: 13px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 6px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .internship-card-grid {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .company-info {
    width: 100%;
  }

  .card-actions {
    width: 100%;
    justify-content: space-between;
  }

  .card-btn {
    flex: 1;
    text-align: center;
  }
}


/* 我的实习卡片网格 */
.internship-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* 我的实习卡片 */
.internship-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.internship-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 我的实习卡片标题 */
.internship-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

/* 我的实习卡片内容 */
.internship-card p {
  margin: 10px 0;
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
}

.internship-card p strong {
  color: #909399;
  font-weight: 400;
}

/* 状态标签 */
.internship-card .status-pending {
  background: #fff7e6;
  color: #fa8c16;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.internship-card .status-approved {
  background: #f6ffed;
  color: #52c41a;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.internship-card .status-rejected {
  background: #fff2f0;
  color: #ff4d4f;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.internship-card .status-confirmed {
  background: #f0f9ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.internship-card .status-completed {
  background: #f5f7fa;
  color: #606266;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

/* 确认实习按钮 */
.internship-card .card-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.internship-card .primary-btn {
  width: 100%;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.internship-card .primary-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 我的实习响应式适配 */
@media (max-width: 768px) {
  .internship-card-list {
    grid-template-columns: 1fr;
  }
}
</style>
