import api from './api.js'

export const orderService = {
  list(params) {
    return api.get('/api/orders', { params }).then((r) => r.data)
  },
  get(id) {
    return api.get(`/api/orders/${id}`).then((r) => r.data)
  },
  create(body) {
    return api.post('/api/orders', body).then((r) => r.data)
  },
  update(id, body) {
    return api.patch(`/api/orders/${id}`, body).then((r) => r.data)
  },
  remove(id) {
    return api.delete(`/api/orders/${id}`).then((r) => r.data)
  },
  invoice(id) {
    return api.get(`/api/orders/${id}/invoice`).then((r) => r.data)
  },
}
