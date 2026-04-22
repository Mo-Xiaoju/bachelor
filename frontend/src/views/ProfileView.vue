<script setup lang="ts">
import { onMounted, ref } from 'vue'

const user = ref<any>(null)
const loading = ref(true)
const activeMenu = ref('个人信息')
const isEditing = ref(false)

const menuItems = ref([{ name: '个人信息', path: 'profile' }])

const editForm = ref({
  contact: '',
  email: '',
})

const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')
  console.log('Navbar - 获取 Token:', token ? '存在' : '不存在')
  return token
}

const checkAuth = async () => {
  const token = getToken()
  try {
    const response = await fetch('http://localhost:5000/api/check-auth', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()

    if (result.success) {
      user.value = result.user
    } else {
      window.location.href = '/login'
    }
  } catch (error) {
    window.location.href = '/login'
  } finally {
    loading.value = false
  }
}

const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
  console.log('点击菜单:', item.name, '路径:', item.path)
}

const editContactInfo = () => {
  editForm.value.contact = user.value?.contact || ''
  editForm.value.email = user.value?.email || ''
  isEditing.value = true
}

const saveContactInfo = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(editForm.value),
    })
    const result = await response.json()
    if (result.success) {
      user.value.contact = editForm.value.contact
      user.value.email = editForm.value.email
      isEditing.value = false
      alert('联系方式保存成功')
    } else {
      alert('保存失败: ' + result.message)
    }
  } catch (error) {
    console.error('保存联系方式失败', error)
    alert('网络错误，请稍后重试')
  }
}

onMounted(checkAuth)
</script>

<style scoped>
.profile-view {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 内容容器 */
.profile-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.title-section h1 {
  color: #2c3e50;
  font-size: 32px;
  font-weight: 700;
  position: relative;
  display: inline-block;
}

.title-section h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* 主要内容区域：1-2布局 */
.main-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

/* 左侧：标签栏 */
.left-panel {
  width: 250px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.menu-section {
  margin-bottom: 25px;
}

.menu-title {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-left: 15px;
  border-left: 4px solid #667eea;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(5px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

/* 右侧：内容区域 */
.right-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

/* 个人信息 */
.profile-content {
  animation: fadeIn 0.5s ease;
}

.profile-card {
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.profile-card h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.user-details p {
  margin: 15px 0;
  font-size: 15px;
  color: #34495e;
  line-height: 1.6;
}

.user-details p strong {
  color: #2c3e50;
  width: 100px;
  display: inline-block;
}

.contact-info {
  margin-bottom: 20px;
}

.contact-info p {
  margin: 15px 0;
  font-size: 15px;
  color: #34495e;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-info p strong {
  color: #2c3e50;
  width: 100px;
  display: inline-block;
}

.edit-section {
  margin-top: 25px;
  text-align: center;
}

.edit-btn {
  padding: 10px 30px;
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

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.edit-form {
  margin-top: 25px;
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.edit-form h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
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
  display: flex;
  align-items: center;
  gap: 5px;
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
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.save-btn {
  padding: 10px 30px;
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

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.cancel-btn {
  padding: 10px 30px;
  background: #f8f9ff;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8ebff;
  border-color: #667eea;
  color: #667eea;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


</style>

<template>
  <div class="profile-view">
    <div class="profile-container">
      <!-- 标题区域 -->
      <div class="title-section">
        <h1>个人信息</h1>
      </div>



      <!-- 主要内容区域：1-2布局 -->
      <div class="main-content">
        <!-- 左侧：标签栏 -->
        <div class="left-panel">
          <div class="menu-section">
            <h3 class="menu-title">个人设置</h3>
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

        <!-- 右侧：内容区域 -->
        <div class="right-panel">
          <!-- 个人信息 -->
          <div v-if="activeMenu === '个人信息'" class="profile-content">
            <div class="profile-card">
              <h3>用户信息</h3>
              <div class="user-details">
                <p><strong>用户名：</strong>{{ user?.username }}</p>
                <p><strong>真实姓名：</strong>{{ user?.realname }}</p>
                <p><strong>专业：</strong>{{ user?.major || '未设置' }}</p>
                <p><strong>院系：</strong>{{ user?.department || '未设置' }}</p>
                <div class="contact-info">
                  <p><strong>联系电话：</strong>{{ user?.contact || '未设置' }}</p>
                  <p><strong>电子邮箱：</strong>{{ user?.email || '未设置' }}</p>
                </div>
              </div>
              <div class="edit-section">
                <button class="edit-btn" @click="editContactInfo">编辑联系方式</button>
              </div>
            </div>

            <!-- 编辑表单 -->
            <div v-if="isEditing" class="edit-form">
              <h3>编辑联系方式</h3>
              <div class="form-row">
                <div class="form-item">
                  <label>联系电话：</label>
                  <input type="tel" v-model="editForm.contact" placeholder="请输入联系电话" />
                </div>
                <div class="form-item">
                  <label>电子邮箱：</label>
                  <input type="email" v-model="editForm.email" placeholder="请输入电子邮箱" />
                </div>
              </div>
              <div class="form-actions">
                <button class="save-btn" @click="saveContactInfo">保存</button>
                <button class="cancel-btn" @click="isEditing = false">取消</button>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>
