import api from './api.js'

export const reservationService = {
  list(params) {
    return api.get('/api/reservations', { params }).then((r) => r.data)
  },
  create(body) {
    return api.post('/api/reservations', body).then((r) => r.data)
  },
  update(id, body) {
    return api.patch(`/api/reservations/${id}`, body).then((r) => r.data)
  },
  remove(id) {
    return api.delete(`/api/reservations/${id}`).then((r) => r.data)
  },
}
