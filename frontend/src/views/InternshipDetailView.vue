<!-- frontend/src/views/InternshipDetailView.vue -->


<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const route = useRoute()
const router = useRouter()
const internship = ref<any>(null)
const canApply = ref(false)
const mapLoaded = ref(false)

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'active': '招聘中',
    'closed': '已关闭',
    'pending': '待审核'
  }
  return statusMap[status] || status
}

const getInternshipDetail = async () => {
  try {
    const id = route.params.id as string
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/internship/${id}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      internship.value = result.internship

      // 判断是否可以申请
      const userRole = sessionStorage.getItem('role')
      canApply.value = userRole === 'student' && internship.value.status === 'active'

      // 等待DOM更新后加载地图
      nextTick(() => {
        loadBaiduMap()
      })
    }
  } catch (error) {
    console.error('获取实习详情失败', error)
  }
}

const goBack = () => {
  router.push('/internship')
}

const applyInternship = () => {
  router.push(`/internship/apply/${internship.value.id}`)
}

const viewCompanyJobs = () => {
  // TODO: 跳转到该公司其他职位页面
  console.log('查看该公司其他职位')
}

// 加载百度地图
const loadBaiduMap = () => {
  // 百度地图AK
  const BAIDU_MAP_AK = '65Di4aWq8hr10t7szdW7Se4wLh7dDZKM'

  // 检查地图容器是否存在
  const mapContainer = document.getElementById('baiduMap')
  if (!mapContainer) {
    console.error('地图容器不存在')
    return
  }

  // 如果已经加载过，直接初始化
  if (window.BMap) {
    console.log('百度地图SDK已加载，初始化地图')
    initMap()
    return
  }

  // 动态加载百度地图SDK（使用WebGL版本）
  console.log('开始加载百度地图SDK...')
  console.log('AK:', BAIDU_MAP_AK)
  console.log('当前页面URL:', window.location.href)
  
  const script = document.createElement('script')
  script.type = 'text/javascript'
  // 使用WebGL版本（v1.0）
  script.src = `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${BAIDU_MAP_AK}`
  
  script.onload = () => {
    console.log('百度地图SDK脚本加载成功')
    console.log('等待BMapGL对象初始化...')
    
    // 轮询检查BMapGL对象
    const checkReady = () => {
      if (window.BMapGL) {
        console.log('✓ BMapGL对象已就绪')
        initMapGL()
      } else if (window.BMap) {
        console.log('✓ BMap对象已就绪')
        initMap()
      } else {
        console.log('等待中...')
        setTimeout(checkReady, 200)
      }
    }
    
    // 开始检查
    setTimeout(checkReady, 300)
  }

  script.onerror = (error) => {
    console.error('百度地图SDK脚本加载失败:', error)
  }

  document.head.appendChild(script)
}

// 初始化地图
const initMap = () => {
  if (!internship.value || !window.BMap) {
    console.error('地图初始化失败：数据或SDK未就绪')
    console.log('internship.value:', internship.value)
    console.log('window.BMap:', window.BMap)
    return
  }

  const mapContainer = document.getElementById('baiduMap')
  if (!mapContainer) {
    console.error('地图容器不存在')
    return
  }

  console.log('开始初始化地图...')
  const address = internship.value.location

  try {
    // 创建地图实例（使用BMap而不是BMapGL）
    const map = new window.BMap.Map('baiduMap')

    // 设置中心点和缩放级别（默认北京）
    map.centerAndZoom(new window.BMap.Point(116.404, 39.915), 12)

    // 启用鼠标滚轮缩放
    map.enableScrollWheelZoom(true)

    // 添加控件
    map.addControl(new window.BMap.NavigationControl())
    map.addControl(new window.BMap.ScaleControl())

    console.log('地图初始化成功，开始地址解析...')

    // 地址解析
    const geocoder = new window.BMap.Geocoder()
    geocoder.getPoint(address, (point: any) => {
      if (point) {
        console.log('地址解析成功:', point)
        map.centerAndZoom(point, 16)

        // 添加标记
        const marker = new window.BMap.Marker(point)
        map.addOverlay(marker)

        // 添加信息窗口
        const infoWindow = new window.BMap.InfoWindow(
          `<div style="padding: 10px;">
            <h4 style="margin: 0 0 8px 0;">${internship.value.companyName}</h4>
            <p style="margin: 0; color: #666;">${address}</p>
          </div>`
        )

        marker.addEventListener('click', () => {
          map.openInfoWindow(infoWindow, point)
        })

        // 自动打开信息窗口
        setTimeout(() => {
          map.openInfoWindow(infoWindow, point)
        }, 500)
      } else {
        console.error('地址解析失败:', address)
      }
    }, { city: internship.value.city })

    mapLoaded.value = true
  } catch (error) {
    console.error('地图初始化异常:', error)
  }
}

onMounted(() => {
  getInternshipDetail()
})
</script>

<template>
  <div class="internship-detail-view">
    <div class="back-btn" @click="goBack">← 返回列表</div>

    <div class="detail-card" v-if="internship">
      <!-- 顶部核心区域 -->
      <div class="detail-header">
        <div class="header-left">
          <h1 class="job-title">{{ internship.title }}</h1>
          <div class="job-meta">
            <span class="meta-item">📍 {{ internship.city }}</span>
            <span class="meta-item">💼 {{ internship.experienceRequirement }}</span>
            <span class="meta-item">🎓 {{ internship.educationRequirement }}</span>
          </div>
          <!-- 福利标签 -->
          <div class="welfare-tags-inline">
            <span v-for="tag in internship.welfareTags" :key="tag" class="welfare-tag-inline">{{ tag }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="salary">{{ internship.salary }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn-interest">♡ 感兴趣</button>
        <button class="btn-apply" v-if="canApply" @click="applyInternship">立即沟通</button>
        <span class="btn-apply disabled" v-else>企业用户</span>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 左侧内容 -->
        <div class="left-content">
          <!-- 职位描述 -->
          <div class="content-section">
            <h3 class="section-title">职位描述</h3>
            <!-- 技能标签 -->
            <div class="skill-tags">
              <span v-for="tag in internship.skillTags" :key="tag" class="skill-tag">{{ tag }}</span>
            </div>
            <div class="job-description" v-html="internship.description"></div>
          </div>

          <!-- 任职要求 -->
          <div class="content-section">
            <h3 class="section-title">任职要求</h3>
            <div class="job-requirements" v-html="internship.requirements"></div>
          </div>

          <!-- 公司地址 -->
          <div class="content-section">
            <h3 class="section-title">公司地址</h3>
            <p class="company-address">{{ internship.location }}</p>
          </div>

          <!-- 地图区域 -->
          <div class="content-section map-section">
            <h3 class="section-title">周边情况</h3>
            <div id="baiduMap" class="baidu-map"></div>
            <div class="map-info">
              <p class="map-tip">💡 地图显示工作地址周边情况</p>
            </div>
          </div>
        </div>

        <!-- 右侧公司信息 -->
        <div class="right-sidebar">
          <div class="company-card">
            <h3 class="sidebar-title">公司基本信息</h3>
            <div class="company-info">
              <div class="company-name-row">
                <div class="company-logo">{{ internship.companyName.charAt(0) }}</div>
                <span class="company-name">{{ internship.companyName }}</span>
              </div>
              <div class="company-detail">
                <span class="detail-icon">🏢</span>
                <span>{{ internship.companyField }}</span>
              </div>
              <div class="company-detail">
                <span class="detail-icon">📊</span>
                <span>{{ internship.companyScale }}</span>
              </div>
              <div class="company-detail">
                <span class="detail-icon">️</span>
                <span>{{ internship.companyNature }}</span>
              </div>
            </div>
            <button class="btn-view-jobs" @click="viewCompanyJobs">查看全部职位</button>
          </div>

          <!-- 公司介绍 -->
          <div class="company-card">
            <h3 class="sidebar-title">公司介绍</h3>
            <p class="company-description">{{ internship.companyDescription || '暂无介绍' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>



<style scoped>
.internship-detail-view {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20px;
  margin-top: 60px;
}

.back-btn {
  cursor: pointer;
  color: #409eff;
  margin-bottom: 20px;
  font-size: 14px;
  display: inline-block;
}

.detail-card {
  max-width: 1200px;
  margin: 0 auto;
}

/* 顶部核心区域 */
.detail-header {
  background: linear-gradient(135deg, #3a506b 0%, #5b8c8c 100%);
  padding: 30px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-left {
  flex: 1;
}

.job-title {
  font-size: 28px;
  color: white;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.job-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.header-right {
  text-align: right;
}

.salary {
  font-size: 28px;
  color: #ff6b6b;
  font-weight: 700;
}

/* 福利标签（内联） */
.welfare-tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.welfare-tag-inline {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(10px);
}

/* 操作按钮 */
.action-buttons {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.btn-interest {
  padding: 10px 24px;
  border: 1px solid #409eff;
  background: transparent;
  color: #409eff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-interest:hover {
  background: #f0f5ff;
}

.btn-apply {
  padding: 10px 32px;
  background: #00b4b4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-apply:hover {
  background: #009999;
}

.btn-apply.disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 20px;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.right-sidebar {
  width: 320px;
  flex-shrink: 0;
}

/* 内容区块 */
.content-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

/* 技能标签 */
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.skill-tag {
  background: #e8f4fd;
  color: #1890ff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
}

/* 职位描述和任职要求 */
.job-description,
.job-requirements {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
  white-space: pre-wrap;
}

.company-address {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 右侧公司信息卡片 */
.company-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.company-info {
  margin-bottom: 16px;
}

.company-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.company-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.company-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.company-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.detail-icon {
  font-size: 16px;
}

.btn-view-jobs {
  width: 100%;
  padding: 10px;
  border: 1px solid #00b4b4;
  background: transparent;
  color: #00b4b4;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-view-jobs:hover {
  background: #f0fffe;
}

.company-description {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
  margin: 0;
}

/* 地图样式 */
.map-section {
  padding: 0;
  overflow: hidden;
}

.map-section .section-title {
  padding: 24px 24px 16px;
  margin: 0;
}

.baidu-map {
  width: 100%;
  height: 400px;
  border-radius: 0;
}

.map-info {
  padding: 16px 24px;
  background: #f9f9f9;
}

.map-tip {
  margin: 0;
  font-size: 13px;
  color: #999;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .right-sidebar {
    width: 100%;
  }

  .detail-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    text-align: left;
  }
}
</style>
