import api from './api.js'

export const menuService = {
  categories() {
    return api.get('/api/menu/categories').then((r) => r.data)
  },
  saveCategory(body) {
    if (body._id) return api.patch(`/api/menu/categories/${body._id}`, body).then((r) => r.data)
    return api.post('/api/menu/categories', body).then((r) => r.data)
  },
  deleteCategory(id) {
    return api.delete(`/api/menu/categories/${id}`).then((r) => r.data)
  },
  items(params) {
    return api.get('/api/menu/items', { params }).then((r) => r.data)
  },
  saveItem(body) {
    if (body._id) return api.patch(`/api/menu/items/${body._id}`, body).then((r) => r.data)
    return api.post('/api/menu/items', body).then((r) => r.data)
  },
  deleteItem(id) {
    return api.delete(`/api/menu/items/${id}`).then((r) => r.data)
  },
}
