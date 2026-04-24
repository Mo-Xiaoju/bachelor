<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const route = useRoute()
const user = ref<any>(null)
const loading = ref(true)

// 获取存储的 token
const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')

  return token
}

// 获取存储的用户信息
const getStoredUser = (): any => {
  const userStr = sessionStorage.getItem('user')

  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {

      return null
    }
  }
  return null
}

const checkAuth = async () => {
  const token = getToken()

  // 如果没有 token，尝试从 localStorage 读取用户信息
  if (!token) {



      user.value = null

    loading.value = false
    return
  }


  try {
    const response = await fetch(buildURL('/api/check-auth'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const result = await response.json()


    if (result.success) {
      user.value = result.user


      sessionStorage.setItem('user', JSON.stringify(result.user))
    } else {

      // Token 无效，清除存储
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      user.value = null
    }
  } catch (error) {

    user.value = null
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  try {
    // 立即清除本地状态，让UI立即更新

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    user.value = null

    // 发送登出请求
    const token = getToken()
    const response = await fetch(buildURL('/api/logout'), {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    const result = await response.json()



    // 跳转到登录页
    router.push('/login')
  } catch (error) {

    // 即使失败也要清除本地状态并跳转
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    user.value = null
    router.push('/login')
  }
}

// 组件挂载时检查
onMounted(() => {
  checkAuth()
})

// 监听路由变化，每次切换页面时重新检查登录状态
watch(() => route.path, () => {
  checkAuth()
})
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <RouterLink to="/">教学管理辅助系统</RouterLink>
      </div>

      <div class="navbar-links">
        <RouterLink to="/login" class="nav-link" v-if="!user">登录</RouterLink>
        <RouterLink to="/" class="nav-link" v-if="user">首页</RouterLink>
        <RouterLink to="/about" class="nav-link">关于</RouterLink>

        <RouterLink to="/logout" class="nav-link" @click="logout" v-if="user">退出登录</RouterLink>
        <RouterLink to="/admin" class="nav-link" v-if="user?.role=='admin'">管理员面板</RouterLink>



        <div v-if="user" class="user-info">
          <RouterLink to="/profile" class="user-name">{{ user.realname }} ({{ user.username }})</RouterLink>

        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100%;
  min-width: 100vw;
}

.navbar-container {
  width: 100%;
  padding: 0 30px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 60px;
  gap: 40px;
}

.navbar-brand {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.navbar-brand a {
  color: #667eea;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 25px;
  flex: 1;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: #667eea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.user-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.logout-btn {
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.logout-btn:hover {
  background: #d32f2f;
}
</style>
