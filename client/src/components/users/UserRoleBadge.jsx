import Badge from '../common/Badge.jsx'
import { ROLES, formatRoleLabel } from '../../utils/constants.js'

export default function UserRoleBadge({ role }) {
  const tone =
    role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN
      ? 'warning'
      : role === ROLES.MANAGER
        ? 'info'
        : role === ROLES.RECEPTION
          ? 'success'
          : 'default'
  return <Badge tone={tone}>{formatRoleLabel(role)}</Badge>
}
