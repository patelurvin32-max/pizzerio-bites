import api from './api.js'

export const notificationService = {
  list(params) {
    return api.get('/api/notifications', { params }).then((r) => r.data)
  },
  markRead(id) {
    return api.patch(`/api/notifications/${id}/read`).then((r) => r.data)
  },
  markAllRead() {
    return api.post('/api/notifications/read-all').then((r) => r.data)
  },
}
