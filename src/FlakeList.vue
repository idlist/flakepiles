<script setup lang="ts">
// 定义数据结构接口
export interface CardData {
  id: number
  title: string
  content: string
}

// 双向绑定：接收父组件传来的数组，修改后自动通知父组件
const cards = defineModel<CardData[]>({ default: [] })

// 添加新卡片
const addCard = () => {
  cards.value.push({
    id: Date.now(),
    title: '新卡片',
    content: ''
  })
}

// 删除卡片
const removeCard = (index: number) => {
  cards.value.splice(index, 1)
}
</script>

<template>
  <div class="board-container">
    <div class="toolbar">
      <button @click="addCard">➕ 添加卡片</button>
    </div>

    <div class="cards-grid">
      <div v-for="(card, index) of cards" :key="card.id" class="card-item">
        <div class="card-header">
          <input v-model="card.title" placeholder="标题" class="title-input" />
          <button class="delete-btn" title="删除" @click="removeCard(index)">×</button>
        </div>
        <textarea v-model="card.content" placeholder="输入内容..." class="content-input"></textarea>
      </div>
    </div>

    <div v-if="cards.length === 0" class="empty-tip">
      点击上方按钮添加第一张卡片
    </div>
  </div>
</template>

<style scoped>
.board-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  margin-bottom: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  overflow-y: auto;
}

.card-item {
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-input {
  font-weight: bold;
  background: transparent;
  border: none;
  width: 100%;
}

.content-input {
  resize: vertical;
  min-height: 80px;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  padding: 8px;
}

.delete-btn {
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  background: none;
  border: none;
}

.delete-btn:hover {
  color: var(--text-error);
}
</style>
