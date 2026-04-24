<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { buildURL } from '../utils/api'

const route = useRoute()
const announcement = ref<any>(null)
const loading = ref(true)
const error = ref('')

const getAnnouncementDetail = async () => {
  const id = route.params.id
  loading.value = true
  error.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/announcements/${id}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      announcement.value = result.announcement
    } else {
      error.value = result.message
    }
  } catch (err) {
    console.error('获取公告详情失败', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const downloadAttachment = async (attachmentId: number, filename: string) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/attachments/${attachmentId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载附件失败', err)
    alert('下载附件失败，请稍后重试')
  }
}

onMounted(() => {
  getAnnouncementDetail()
})
</script>

<template>
  <div class="announcement-detail">
    <div class="detail-container">
      <div class="detail-header">
        <h1>公告详情</h1>
        <button class="back-btn" @click="$router.push({ name: 'home' })"to="/">返回</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="getAnnouncementDetail">重试</button>
      </div>

      <div v-else-if="announcement" class="detail-content">
        <div class="announcement-header">
          <h2>{{ announcement.title }}</h2>
          <div class="announcement-meta">
            <span class="publish-time">发布时间：{{ announcement.created_at }}</span>
          </div>
        </div>

        <div class="announcement-body">
          <div class="content">
            {{ announcement.content }}
          </div>

          <div v-if="announcement.attachments && announcement.attachments.length > 0" class="attachments-section">
            <h3>附件</h3>
            <div class="attachment-list">
              <div v-for="(attachment, index) in announcement.attachments" :key="index" class="attachment-item">
                <button
                  @click="downloadAttachment(attachment.id, attachment.filename)"
                  class="attachment-link"
                >
                  <span class="attachment-icon">📎</span>
                  <span class="attachment-name">{{ attachment.filename }}</span>
                  <span class="attachment-size">({{ attachment.size }} KB)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>公告不存在</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.announcement-detail {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-header {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  color: white;
  padding: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.loading-state,
.error-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1e88e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p,
.error-state p,
.empty-state p {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.retry-btn {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(30, 136, 229, 0.3);
}

.detail-content {
  padding: 40px;
}

.announcement-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.announcement-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
}

.announcement-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.announcement-body {
  line-height: 1.6;
  color: #333;
}

.content {
  font-size: 16px;
  margin-bottom: 30px;
  white-space: pre-wrap;
}

.attachments-section {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.attachments-section h3 {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.attachment-item:hover {
  background: #e3f2fd;
  border-color: #1e88e5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.2);
}

.attachment-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.attachment-link:hover {
  color: #1e88e5;
}

.attachment-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.attachment-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.attachment-size {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .announcement-detail {
    padding: 20px 10px;
  }

  .detail-container {
    border-radius: 8px;
  }

  .detail-header {
    padding: 20px;
  }

  .detail-header h1 {
    font-size: 20px;
  }

  .detail-content {
    padding: 20px;
  }

  .announcement-header h2 {
    font-size: 20px;
  }

  .content {
    font-size: 14px;
  }
}
</style>
