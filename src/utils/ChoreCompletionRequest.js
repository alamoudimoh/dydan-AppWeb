export const completeChoreRequest = (
  id,
  body = {},
  completedDate,
  performer,
) => {
  const payload = { ...body }

  if (completedDate) {
    payload.completedTime = new Date(completedDate).toISOString()
  }
  if (performer) {
    payload.completedBy = Number(performer)
  }

  return { endpoint: `/chores/${id}/do`, payload }
}

export const chorePriorityEndpoint = id => `/chores/${id}/priority`
