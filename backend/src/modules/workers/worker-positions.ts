/** Master chức vụ nhân viên + nhóm. Sau này có thể nâng thành bảng/config sửa được. */
export const STAFF_POSITIONS: string[] = ['foreman', 'deputy_foreman', 'team_leader', 'deputy_leader', 'worker']
export const MANAGEMENT_POSITIONS: string[] = ['director', 'deputy_director', 'chief_accountant', 'accountant', 'storekeeper', 'sales', 'other']
export const ALL_POSITIONS: string[] = [...STAFF_POSITIONS, ...MANAGEMENT_POSITIONS]
