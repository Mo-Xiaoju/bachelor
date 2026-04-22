<script setup lang="ts">
</script>

<template>
  <div class="about">
    <h1>关于系统</h1>
    <div class="about-content">
      <div class="about-card">
        <h3>系统介绍</h3>
        <p>教学管理辅助系统是一个用于教学管理的平台。</p>
      </div>

      <div class="about-card">
        <h3>技术栈</h3>
        <ul>
          <li>前端：Vue 3 + TypeScript + Vite</li>
          <li>后端：Flask + MySQL</li>
        </ul>
      </div>

      <div class="about-card">
        <h3>系统功能</h3>
        <ul>
          <li>用户登录</li>
          <li>个人信息概览</li>
          <li>项目管理</li>
          <li>任务分配</li>
          <li>进度跟踪</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.about h1 {
  text-align: center;
  font-size: 28px;
  color: #333;
  margin-bottom: 40px;
}

.about-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.about-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.about-card h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.about-card p {
  color: #666;
  line-height: 1.6;
}

.about-card ul {
  list-style: none;
}

.about-card ul li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  color: #555;
}

.about-card ul li::before {
  content: '•';
  color: #667eea;
  font-weight: bold;
  margin-right: 8px;
}
</style>
