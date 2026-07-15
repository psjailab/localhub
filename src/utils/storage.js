const STORAGE_KEY = 'localhub_posts_v1';
const SIZE_LIMIT = 5_000_000; // 약 5MB

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function approxSizeOfString(str) {
  return new Blob([str]).size;
}

export function getPosts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function savePosts(posts) {
  const raw = JSON.stringify(posts);
  const size = approxSizeOfString(raw);
  if (size > SIZE_LIMIT) {
    throw new Error('STORAGE_LIMIT_EXCEEDED');
  }
  localStorage.setItem(STORAGE_KEY, raw);
}

export function canSavePosts(posts) {
  const raw = JSON.stringify(posts);
  return approxSizeOfString(raw) <= SIZE_LIMIT;
}

export function currentStorageSize() {
  const raw = localStorage.getItem(STORAGE_KEY) || '[]';
  return approxSizeOfString(raw);
}

export function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function createPost({ title, content, password }) {
  const posts = getPosts();
  const post = {
    id: generateId(),
    title: title || '(제목 없음)',
    content: content || '',
    password: password || '', // 평문 저장(요구사항)
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
  posts.unshift(post);
  savePosts(posts);
  return post;
}

export function updatePost(id, patch) {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  posts[idx] = { ...posts[idx], ...patch, updatedAt: new Date().toISOString() };
  savePosts(posts);
  return posts[idx];
}

export function deletePost(id) {
  const posts = getPosts();
  const filtered = posts.filter(p => p.id !== id);
  savePosts(filtered);
  return filtered;
}

export function getPostById(id) {
  return getPosts().find(p => p.id === id) || null;
}
