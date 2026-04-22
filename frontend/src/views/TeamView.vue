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
          <div class="placeholder-content">
            <p>团队内容将在此显示</p>
          </div>
        </div>

        <!-- 团队组建申请页面 -->
        <div v-if="activeMenu === '团队组建申请'" class="team-application-content">
          <h2>团队组建申请</h2>
          <div class="placeholder-content">
            <p>团队组建申请内容将在此显示</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref<any>(null)
const activeMenu = ref('我的团队')

// 菜单项目
const menuItems = [
  { name: '我的团队', category: '团队管理' },
  { name: '团队组建申请', category: '团队管理' }
]

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
    const response = await fetch('http://localhost:5000/api/user/profile', {
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

// 处理菜单点击
const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
}

// 组件挂载时检查认证状态
onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.team-view {
  padding: 20px;
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

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.placeholder-content p {
  font-size: 1.2rem;
  color: #666;
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
