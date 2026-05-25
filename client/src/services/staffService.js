import api from './api.js'

export const staffService = {
  list() {
    return api.get('/api/staff').then((r) => r.data)
  },
  create(body) {
    return api.post('/api/staff', body).then((r) => r.data)
  },
  update(id, body) {
    return api.patch(`/api/staff/${id}`, body).then((r) => r.data)
  },
  remove(id) {
    return api.delete(`/api/staff/${id}`).then((r) => r.data)
  },
  addAttendance(id, body) {
    return api.post(`/api/staff/${id}/attendance`, body).then((r) => r.data)
  },
}
