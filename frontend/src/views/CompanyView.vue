<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// 导入 china-area-data 包
import chinaAreaData from 'china-area-data'

// 省市区数据
const provinces = ref([])

// 处理数据导入
let provinceList: any, cityList: any, areaList: any

// 初始化省份数据
const initProvinces = () => {

  if (provinceList && typeof provinceList === 'object') {


    provinces.value = Object.entries(provinceList).map(([code, name]) => ({
      value: code,
      label: name,
    }))


  } else {

    provinces.value = []
  }
}



// 检查 chinaAreaData 是否有效
if (chinaAreaData && typeof chinaAreaData === 'object') {
  console.log('china-area-data 键:', Object.keys(chinaAreaData))

  // 使用正确的包结构：chinaAreaData['86'] 包含所有省份
  if (chinaAreaData['86']) {
    provinceList = chinaAreaData['86']

  } else {

  }
} else {

}



// 确保在模块加载时就初始化数据
if (provinceList) {

  initProvinces()
} else {

}

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)
const companyInfo = ref<any>(null)
const companyStatus = ref('pending') // pending, approved, rejected
const reviewComment = ref('')
const loadingCompany = ref(false)
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

// 获取企业信息和审核状态
const getCompanyInfo = async () => {
  loadingCompany.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()

    if (result.success) {
      companyInfo.value = result.company
      companyStatus.value = result.company.status
      reviewComment.value = result.company.review_comment || ''
    } else {
      errorMessage.value = result.message || '获取企业信息失败'
    }
  } catch (error) {
    console.error('获取企业信息失败', error)
    errorMessage.value = '获取企业信息失败，请稍后重试'
  } finally {
    loadingCompany.value = false
  }
}

// 重新上传证明材料
const showReuploadDialog = ref(false)
const reuploadFile = ref<File | null>(null)

// 发布实习招聘
const showPublishInternship = ref(false)
const internshipForm = ref({
  title: '',
  position: '',
  description: '',
  requirements: '',
  province: '',
  city: '',
  district: '',
  address: '',
  salary: '',
  skillTags: [] as string[],
  welfareTags: [] as string[],
  quota: 1,
  deadline: '',
})

// 标签输入
const skillTagInput = ref('')
const welfareTagInput = ref('')


// 获取城市列表
const filteredCities = computed(() => {
  if (!internshipForm.value.province) return []
  const provinceCode = internshipForm.value.province

  // 使用 chinaAreaData 直接获取城市数据
  if (chinaAreaData && chinaAreaData[provinceCode]) {
    const cities = chinaAreaData[provinceCode]

    return Object.entries(cities).map(([code, name]) => ({
      value: code,
      label: name,
    }))
  } else {

    return []
  }
})

// 获取区县列表
const filteredDistricts = computed(() => {
  if (!internshipForm.value.city) return []
  const cityCode = internshipForm.value.city

  // 使用 chinaAreaData 直接获取区县数据
  if (chinaAreaData && chinaAreaData[cityCode]) {
    const districts = chinaAreaData[cityCode]

    return Object.entries(districts).map(([code, name]) => ({
      value: code,
      label: name,
    }))
  } else {

    return []
  }
})

// 监听省份变化
watch(
  () => internshipForm.value.province,
  () => {
    internshipForm.value.city = ''
    internshipForm.value.district = ''
  },
)

// 监听城市变化
watch(
  () => internshipForm.value.city,
  () => {
    internshipForm.value.district = ''
  },
)

// 添加技能标签
const addSkillTag = () => {
  const tag = skillTagInput.value.trim()
  if (tag && !internshipForm.value.skillTags.includes(tag)) {
    internshipForm.value.skillTags.push(tag)
    skillTagInput.value = ''
  }
}

// 移除技能标签
const removeSkillTag = (index: number) => {
  internshipForm.value.skillTags.splice(index, 1)
}

// 添加福利标签
const addWelfareTag = () => {
  const tag = welfareTagInput.value.trim()
  if (tag && !internshipForm.value.welfareTags.includes(tag)) {
    internshipForm.value.welfareTags.push(tag)
    welfareTagInput.value = ''
  }
}

// 移除福利标签
const removeWelfareTag = (index: number) => {
  internshipForm.value.welfareTags.splice(index, 1)
}

// 学生管理
const showStudentManagement = ref(false)
const studentApplications = ref<any[]>([])

// 企业描述编辑
const editingDescription = ref(false)
const companyDescription = ref('')

// 保存企业描述
const saveDescription = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/update-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        description: companyDescription.value
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      // 重新获取企业信息
      await getCompanyInfo()
      editingDescription.value = false
      errorMessage.value = '企业描述已更新'
    } else {
      errorMessage.value = result.message || '更新失败'
    }
  } catch (error) {
    console.error('更新企业描述失败', error)
    errorMessage.value = '更新失败，请稍后重试'
  }
}

// 打开学生管理页面
const openStudentManagement = () => {
  router.push('/company/students')
}

// 获取学生申请列表
const getStudentApplications = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/applications', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      studentApplications.value = result.applications
    } else {
      errorMessage.value = result.message || '获取申请列表失败'
    }
  } catch (error) {
    console.error('获取申请列表失败', error)
    errorMessage.value = '获取申请列表失败，请稍后重试'
  }
}

// 状态文本
const getStatusText = (status: string) => {
  const statusMap: any = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
  }
  return statusMap[status] || status
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    reuploadFile.value = target.files[0]
  }
}

const reuploadProof = async () => {
  if (!reuploadFile.value) {
    errorMessage.value = '请选择要上传的文件'
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('proof_file', reuploadFile.value)

    const response = await fetch('http://localhost:5000/api/company/reupload-proof', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      // 重新获取企业信息
      await getCompanyInfo()
      showReuploadDialog.value = false
      reuploadFile.value = null
      errorMessage.value = '证明材料已重新提交，等待审核'
    } else {
      errorMessage.value = result.message || '重新提交失败'
    }
  } catch (error) {


    errorMessage.value = '重新提交失败，请稍后重试'
  }
}

// 发布实习招聘
const publishInternship = async () => {
  try {
    // 表单验证
    if (!internshipForm.value.title.trim()) {
      errorMessage.value = '请填写招聘标题'
      return
    }
    if (!internshipForm.value.position.trim()) {
      errorMessage.value = '请填写实习岗位'
      return
    }
    if (!internshipForm.value.province) {
      errorMessage.value = '请选择省份'
      return
    }
    if (!internshipForm.value.city) {
      errorMessage.value = '请选择城市'
      return
    }
    if (!internshipForm.value.district) {
      errorMessage.value = '请选择区县'
      return
    }
    if (!internshipForm.value.address.trim()) {
      errorMessage.value = '请填写具体地址'
      return
    }
    if (!internshipForm.value.deadline) {
      errorMessage.value = '请选择截止日期'
      return
    }

    const token = sessionStorage.getItem('token')
    // 构建城市和具体地点
    // 根据编码获取真实的地区名称
    const provinceCode = internshipForm.value.province
    const cityCode = internshipForm.value.city
    const districtCode = internshipForm.value.district

    let provinceName = ''
    let cityName = ''
    let districtName = ''

    // 省份编码到名称的映射表
    const provinceMap: Record<string, string> = {
      '110000': '北京市',
      '120000': '天津市',
      '130000': '河北省',
      '140000': '山西省',
      '150000': '内蒙古自治区',
      '210000': '辽宁省',
      '220000': '吉林省',
      '230000': '黑龙江省',
      '310000': '上海市',
      '320000': '江苏省',
      '330000': '浙江省',
      '340000': '安徽省',
      '350000': '福建省',
      '360000': '江西省',
      '370000': '山东省',
      '410000': '河南省',
      '420000': '湖北省',
      '430000': '湖南省',
      '440000': '广东省',
      '450000': '广西壮族自治区',
      '460000': '海南省',
      '500000': '重庆市',
      '510000': '四川省',
      '520000': '贵州省',
      '530000': '云南省',
      '540000': '西藏自治区',
      '610000': '陕西省',
      '620000': '甘肃省',
      '630000': '青海省',
      '640000': '宁夏回族自治区',
      '650000': '新疆维吾尔自治区'
    };

    // 从映射表中获取省份名称
    provinceName = provinceMap[provinceCode] || provinceCode

    // 确保省份名称不为空
    if (!provinceName) {
      provinceName = provinceCode
    }

    // 获取城市名称
    if (chinaAreaData && chinaAreaData[provinceCode]) {
      const provinceData = chinaAreaData[provinceCode];
      if (typeof provinceData === 'object' && provinceData !== null) {
        for (const [code, name] of Object.entries(provinceData)) {
          if (code === cityCode) {
            if (typeof name === 'string') {
              cityName = name;
            }
            break;
          }
        }
      }
    }

    // 获取区县名称
    if (chinaAreaData && chinaAreaData[cityCode]) {
      const cityData = chinaAreaData[cityCode];
      if (typeof cityData === 'object' && cityData !== null) {
        for (const [code, name] of Object.entries(cityData)) {
          if (code === districtCode) {
            if (typeof name === 'string') {
              districtName = name;
            }
            break;
          }
        }
      }
    }

    const city = `${provinceName}${cityName}${districtName}`
    const location = internshipForm.value.address

    const response = await fetch('http://localhost:5000/api/company/publish-internship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: internshipForm.value.title,
        position: internshipForm.value.position,
        description: internshipForm.value.description,
        requirements: internshipForm.value.requirements,
        city: city,
        location: location,
        salary: internshipForm.value.salary,
        skill_tags: internshipForm.value.skillTags,
        welfare_tags: internshipForm.value.welfareTags,
        quota: internshipForm.value.quota,
        deadline: internshipForm.value.deadline,
        company_id: companyInfo.value.id,
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      showPublishInternship.value = false
      // 重置表单
      internshipForm.value = {
        title: '',
        position: '',
        description: '',
        requirements: '',
        province: '',
        city: '',
        district: '',
        address: '',
        salary: '',
        skillTags: [],
        welfareTags: [],
        quota: 1,
        deadline: '',
      }
      skillTagInput.value = ''
      welfareTagInput.value = ''
      errorMessage.value = '实习招聘发布成功'
    } else {
      errorMessage.value = result.message || '发布失败'
    }
  } catch (error) {

    errorMessage.value = '发布失败，请稍后重试'
  }
}

// 学生管理相关函数
const approveApplication = async (id: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/application/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_id: id,
        action: 'approve',
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      const application = studentApplications.value.find((app) => app.id === id)
      if (application) {
        application.status = 'approved'
      }
      errorMessage.value = '申请已批准'
    } else {
      errorMessage.value = result.message || '批准失败'
    }
  } catch (error) {
    console.error('批准申请失败', error)
    errorMessage.value = '批准失败，请稍后重试'
  }
}

const rejectApplication = async (id: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/company/application/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_id: id,
        action: 'reject',
      }),
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      const application = studentApplications.value.find((app) => app.id === id)
      if (application) {
        application.status = 'rejected'
      }
      errorMessage.value = '申请已拒绝'
    } else {
      errorMessage.value = result.message || '拒绝失败'
    }
  } catch (error) {

    errorMessage.value = '拒绝失败，请稍后重试'
  }
}

const viewResume = async (id: number) => {
  try {
    const application = studentApplications.value.find((app) => app.id === id)
    if (application) {
      const token = sessionStorage.getItem('token')
      const response = await fetch(
        `http://localhost:5000/api/internship/resume/${application.resume_file}`,
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
    }
  } catch (error) {

    errorMessage.value = '查看简历失败，请稍后重试'
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
  return announcements.value.filter((announcement) =>
    announcement.title.toLowerCase().includes(query),
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
    const response = await fetch('http://localhost:5000/api/announcements/unread-count', {
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

  }
}

// 获取公告列表
const getAnnouncements = async () => {
  loadingAnnouncements.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/announcements', {
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
  // 检查用户角色，确保只有企业用户访问
  if (user.value?.role !== 'company') {
    router.push('/')
    return
  }
  // 初始化省份数据
  initProvinces()
  // 获取企业信息和审核状态
  await getCompanyInfo()
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
      <h1 v-if="user?.role == 'company'">欢迎回来，{{ companyInfo?.company_name }}！</h1>
      <p class="current-date">
        今天是{{ currentYear }}年{{ currentMonth }}月{{ currentDate.getDate() }}日 星期{{
          weekdays[currentDate.getDay()]
        }}
      </p>
    </div>

    <!-- 中间内容区域（2） -->
    <div class="home-content">
      <!-- 左侧内容区域 -->
      <div class="left-sidebar">
        <!-- 企业状态提示 -->
        <div v-if="loadingCompany" class="status-section loading">
          <h3>加载中...</h3>
        </div>

        <!-- 未审核状态 -->
        <div v-else-if="companyStatus === 'pending'" class="status-section pending">
          <div class="status-icon">⏳</div>
          <h3>等待审核</h3>
          <p>您的企业注册信息正在审核中，请耐心等待。</p>
          <p>审核通过后，您将获得完整的系统访问权限。</p>
        </div>

        <!-- 已拒绝状态 -->
        <div v-else-if="companyStatus === 'rejected'" class="status-section rejected">
          <div class="status-icon">❌</div>
          <h3>审核被拒绝</h3>
          <div class="rejection-reason">
            <h4>拒绝原因：</h4>
            <p>{{ reviewComment || '未提供具体原因' }}</p>
          </div>
          <button class="reupload-btn" @click="showReuploadDialog = true">重新上传证明材料</button>
        </div>

        <!-- 已通过审核 -->
        <div v-else-if="companyStatus === 'approved'" class="company-info-section">
          <h3>企业信息</h3>
          <div class="company-details">
            <div class="detail-item">
              <span class="label">企业名称：</span>
              <span class="value">{{ companyInfo?.company_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">领域：</span>
              <span class="value">{{ companyInfo?.field }}</span>
            </div>
            <div class="detail-item">
              <span class="label">性质：</span>
              <span class="value">{{ companyInfo?.nature }}</span>
            </div>
            <div class="detail-item">
              <span class="label">规模：</span>
              <span class="value">{{ companyInfo?.scale }}</span>
            </div>
            <div class="detail-item">
              <span class="label">联系人：</span>
              <span class="value">{{ user?.realname }}</span>
            </div>
            <div class="detail-item">
              <span class="label">联系方式：</span>
              <span class="value">{{ companyInfo?.contact }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="label">企业描述：</span>
              <div v-if="!editingDescription" class="value description-value">
                {{ companyInfo?.description || '暂无描述' }}
                <button class="edit-btn" @click="editingDescription = true; companyDescription.value = companyInfo?.description || ''">编辑</button>
              </div>
              <div v-else class="description-edit">
                <textarea v-model="companyDescription" placeholder="请输入企业描述" rows="4"></textarea>
                <div class="edit-actions">
                  <button class="cancel-btn" @click="editingDescription = false">取消</button>
                  <button class="submit-btn" @click="saveDescription">保存</button>
                </div>
              </div>
            </div>
            <div class="detail-item">
              <span class="label">审核状态：</span>
              <span class="value status-approved">已通过</span>
            </div>
          </div>
        </div>

        <!-- 系统功能模块 -->
        <div v-if="companyStatus === 'approved'" class="system-functions">
          <h3>企业功能</h3>
          <div class="function-grid">
            <div class="function-item">
              <div class="function-icon">🏢</div>
              <RouterLink to="/internship" class="function-link">实习管理</RouterLink>
            </div>
            <div class="function-item">
              <div class="function-icon">📋</div>
              <a href="#" class="function-link" @click.prevent="showPublishInternship = true"
                >发布实习</a
              >
            </div>
            <div class="function-item">
              <div class="function-icon">👥</div>
              <a href="#" class="function-link" @click.prevent="showStudentManagement = true"
                >学生管理</a
              >
            </div>
            <div class="function-item">
              <div class="function-icon">📊</div>
              <RouterLink to="/internship" class="function-link">数据统计</RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="right-content">
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
                />
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
                  <span
                    v-if="unreadCount > 0 && showNotificationBadge"
                    class="notification-badge"
                    >{{ unreadCount }}</span
                  >
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
                  <router-link :to="`/announcement/${announcement.id}`" class="announcement-title">
                    {{ announcement.title }}
                  </router-link>
                  <div class="announcement-time">{{ announcement.created_at }}</div>
                  <div
                    v-if="announcement.attachments && announcement.attachments.length > 0"
                    class="announcement-attachments"
                  >
                    <span class="attachment-icon">📎</span>
                    <span class="attachment-count"
                      >{{ announcement.attachments.length }}个附件</span
                    >
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
              <span class="page-info"> {{ currentPage }} / {{ totalPages }} </span>
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
      <div class="logo">企业管理系统</div>
    </div>

    <!-- 错误消息提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 重新上传证明材料对话框 -->
    <div v-if="showReuploadDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>重新上传证明材料</h3>
          <button class="close-btn" @click="showReuploadDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <p>请上传新的企业证明材料，我们将重新审核您的申请。</p>
          <div class="file-upload">
            <input type="file" @change="handleFileChange" class="file-input" id="fileInput" />
            <label for="fileInput" class="file-label">
              <span class="upload-icon">📁</span>
              <span v-if="!reuploadFile" class="upload-text">点击或拖拽文件到此处上传</span>
              <span v-else class="upload-text">已选择：{{ reuploadFile.name }}</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showReuploadDialog = false">取消</button>
          <button class="submit-btn" @click="reuploadProof" :disabled="!reuploadFile">提交</button>
        </div>
      </div>
    </div>

    <!-- 发布实习招聘对话框 -->
    <div v-if="showPublishInternship" class="dialog-overlay">
      <div class="dialog dialog-large">
        <div class="dialog-header">
          <h3>发布实习招聘</h3>
          <button class="close-btn" @click="showPublishInternship = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-item">
              <label>招聘标题：</label>
              <input type="text" v-model="internshipForm.title" placeholder="请输入招聘标题" />
            </div>
            <div class="form-item">
              <label>实习岗位：</label>
              <input type="text" v-model="internshipForm.position" placeholder="请输入实习岗位" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>实习地点：</label>
              <select v-model="internshipForm.province" class="location-select">
                <option value="">请选择省份</option>
                <option v-for="province in provinces" :key="province.value" :value="province.value">
                  {{ province.label }}
                </option>
              </select>
            </div>
            <div class="form-item">
              <label>&nbsp;</label>
              <select v-model="internshipForm.city" class="location-select">
                <option value="">请选择城市</option>
                <option v-for="city in filteredCities" :key="city.value" :value="city.value">
                  {{ city.label }}
                </option>
              </select>
            </div>
            <div class="form-item">
              <label>&nbsp;</label>
              <select v-model="internshipForm.district" class="location-select">
                <option value="">请选择区县</option>
                <option
                  v-for="district in filteredDistricts"
                  :key="district.value"
                  :value="district.value"
                >
                  {{ district.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label>具体地址：</label>
              <input type="text" v-model="internshipForm.address" placeholder="请输入具体地址" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>薪资：</label>
              <input type="text" v-model="internshipForm.salary" placeholder="请输入薪资范围" />
            </div>
            <div class="form-item">
              <label>招聘人数：</label>
              <input
                type="number"
                v-model="internshipForm.quota"
                min="1"
                placeholder="请输入招聘人数"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label>技能标签：</label>
              <div class="tag-container">
                <div v-for="(tag, index) in internshipForm.skillTags" :key="index" class="tag">
                  {{ tag }}
                  <span class="tag-remove" @click="removeSkillTag(index)">×</span>
                </div>
                <div class="tag-input">
                  <input
                    type="text"
                    v-model="skillTagInput"
                    placeholder="输入技能标签，按回车添加"
                    @keyup.enter="addSkillTag"
                  />
                  <button @click="addSkillTag" class="tag-add-btn">添加</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label>福利标签：</label>
              <div class="tag-container">
                <div v-for="(tag, index) in internshipForm.welfareTags" :key="index" class="tag">
                  {{ tag }}
                  <span class="tag-remove" @click="removeWelfareTag(index)">×</span>
                </div>
                <div class="tag-input">
                  <input
                    type="text"
                    v-model="welfareTagInput"
                    placeholder="输入福利标签，按回车添加"
                    @keyup.enter="addWelfareTag"
                  />
                  <button @click="addWelfareTag" class="tag-add-btn">添加</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>截止日期：</label>
              <input type="date" v-model="internshipForm.deadline" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label>职位描述：</label>
              <textarea
                v-model="internshipForm.description"
                placeholder="请输入职位描述"
                rows="4"
              ></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label>任职要求：</label>
              <textarea
                v-model="internshipForm.requirements"
                placeholder="请输入任职要求"
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showPublishInternship = false">取消</button>
          <button class="submit-btn" @click="publishInternship">发布</button>
        </div>
      </div>
    </div>

    <!-- 学生管理对话框 -->
    <div v-if="showStudentManagement" class="dialog-overlay">
      <div class="dialog dialog-large">
        <div class="dialog-header">
          <h3>学生管理</h3>
          <button class="close-btn" @click="showStudentManagement = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="student-list">
            <table class="student-table">
              <thead>
                <tr>
                  <th>学生姓名</th>
                  <th>学号</th>
                  <th>申请岗位</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="application in studentApplications" :key="application.id">
                  <td>{{ application.student_name }}</td>
                  <td>{{ application.student_id }}</td>
                  <td>{{ application.position }}</td>
                  <td>{{ application.apply_time }}</td>
                  <td>
                    <span :class="'status-' + application.status">
                      {{ getStatusText(application.status) }}
                    </span>
                  </td>
                  <td class="operation">
                    <a
                      v-if="application.status === 'pending'"
                      href="#"
                      @click.prevent="approveApplication(application.id)"
                      >批准</a
                    >
                    <a
                      v-if="application.status === 'pending'"
                      href="#"
                      @click.prevent="rejectApplication(application.id)"
                      >拒绝</a
                    >
                    <a href="#" @click.prevent="viewResume(application.id)">查看简历</a>
                  </td>
                </tr>
                <tr v-if="studentApplications.length === 0">
                  <td colspan="6" class="empty-cell">暂无学生申请</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="showStudentManagement = false">关闭</button>
        </div>
      </div>
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
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  padding: 40px 30px;
  flex: 1;
  box-sizing: border-box;
}

/* 左侧内容区域 */
.left-sidebar {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

/* 企业状态区域 */
.status-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  text-align: center;
}

.status-section:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.status-section.pending {
  border-left: 5px solid #ff9800;
}

.status-section.rejected {
  border-left: 5px solid #f44336;
}

.status-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.status-section h3 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.status-section p {
  color: #666;
  font-size: 16px;
  margin: 10px 0;
  line-height: 1.5;
}

.rejection-reason {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.rejection-reason h4 {
  color: #f44336;
  margin: 0 0 10px 0;
}

.reupload-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.reupload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

/* 企业信息区域 */
.company-info-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border-left: 5px solid #4caf50;
}

.company-info-section:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.company-info-section h3 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 30px 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.company-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item .label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.detail-item .value {
  color: #34495e;
  font-size: 16px;
}

.detail-item .value.status-approved {
  color: #4caf50;
  font-weight: 600;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.description-value {
  position: relative;
  padding-right: 80px;
}

.edit-btn {
  position: absolute;
  right: 0;
  top: 0;
  background: #667eea;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.edit-btn:hover {
  background: #764ba2;
}

.description-edit {
  width: 100%;
}

.description-edit textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 10px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-actions button {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.edit-actions .cancel-btn {
  background: #ccc;
  color: #333;
}

.edit-actions .cancel-btn:hover {
  background: #999;
}

.edit-actions .submit-btn {
  background: #667eea;
  color: white;
}

.edit-actions .submit-btn:hover {
  background: #764ba2;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  box-sizing: border-box;
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

/* 右侧内容区域 */
.right-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
  box-sizing: border-box;
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
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
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

/* 错误消息 */
.error-message {
  position: fixed;
  top: 100px;
  right: 20px;
  background: #f44336;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 20px 25px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #666;
}

.dialog-body {
  padding: 30px 25px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 滚动条样式 */
.dialog-body::-webkit-scrollbar {
  width: 8px;
}

.dialog-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dialog-body p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.file-upload {
  border: 2px dashed #667eea;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

.file-upload:hover {
  border-color: #764ba2;
  background: #f8f9ff;
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
  background: rgba(102, 126, 234, 0.1);
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
  color: #667eea;
}

.upload-text {
  display: block;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.file-name {
  display: block;
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.dialog-footer {
  padding: 20px 25px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 学生管理 */
.dialog .student-list {
  max-height: 400px;
  overflow-y: auto;
}

.dialog .student-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.student-table th,
.student-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.student-table th {
  background: #f8f9ff;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 1;
}

.student-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.empty-cell {
  text-align: center;
  padding: 40px !important;
  color: #999;
}

.status-pending {
  color: #ff9800;
  font-weight: 600;
}

.status-approved {
  color: #4caf50;
  font-weight: 600;
}

.status-rejected {
  color: #f44336;
  font-weight: 600;
}

/* 大对话框 */
.dialog-large {
  width: 80%;
  max-width: 800px;
}

/* 表单样式 */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
}

.form-item.full-width {
  flex: 100%;
}

.form-item label {
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-item input,
.form-item textarea {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-item textarea {
  resize: vertical;
  min-height: 100px;
}

/* 地点选择样式 */
.location-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.location-select:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 标签样式 */
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  min-height: 60px;
}

.tag {
  display: inline-flex;
  align-items: center;
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  gap: 8px;
}

.tag-remove {
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

.tag-remove:hover {
  opacity: 0.8;
}

.tag-input {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}

.tag-input input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

.tag-add-btn {
  padding: 0 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tag-add-btn:hover {
  background: #5a6fe6;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .home-content {
    grid-template-columns: 1fr;
  }

  .function-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .company-details {
    grid-template-columns: 1fr;
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

  .status-section {
    padding: 30px;
  }

  .company-info-section {
    padding: 30px;
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
