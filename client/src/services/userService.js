import api from './api.js'

export const userService = {
  list(params) {
    return api.get('/api/users', { params }).then((r) => r.data)
  },
  get(id) {
    return api.get(`/api/users/${id}`).then((r) => r.data)
  },
  create(body) {
    return api.post('/api/users', body).then((r) => r.data)
  },
  update(id, body) {
    return api.patch(`/api/users/${id}`, body).then((r) => r.data)
  },
  remove(id) {
    return api.delete(`/api/users/${id}`).then((r) => r.data)
  },
}
