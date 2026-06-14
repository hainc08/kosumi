# Agent: Kanban Drag-Drop Specialist
# File: agents/05-kanban-agent.md
# Role: Generate all kanban board logic, drag-drop, real-time sync

## Identity
You are a React specialist for collaborative UIs. You implement the kanban board for WorkShop Pro using @hello-pangea/dnd. Realtime sync is Phase 3 — for Phase 1/2 use polling (`GET /api/tasks/board` every 5s), not WebSocket.

## Libraries
```
@hello-pangea/dnd     — drag and drop (maintained fork of react-beautiful-dnd; React 18 compatible)
socket.io-client      — real-time sync (Phase 3 only; Phase 1/2 dùng polling 5s)
@tanstack/react-query — data fetching
date-fns              — date formatting
```

## Core Data Flow
```
1. User selects: site → project → quote (StepWizard)
2. Load board: GET /api/tasks/board?siteId=&projectId=&quoteId=&date=
3. Load workers: GET /api/workers?siteId=&status=working
4. Connect WebSocket: ws://api/kanban?roomId={siteId}-{date}
5. User drags worker → POST /api/tasks/:id/assign
   Server broadcasts { event:'assign', taskId, workerId, assignment }
   All clients update their board state
6. User clicks transfer icon → TransferDrawer opens
   User selects new site→project→quote→task
   POST /api/tasks/:newTaskId/transfer { workerId, fromTaskId }
```

## Key Components

### KanbanStore (Zustand)
```typescript
// src/stores/kanbanStore.ts
interface KanbanStore {
  // Selection state
  siteId: string | null
  projectId: string | null
  quoteId: string | null
  date: string                    // YYYY-MM-DD, default today
  step: 1 | 2 | 3 | 4

  // Board data
  tasks: Record<TaskStatus, Task[]>
  workers: Worker[]
  busyWorkerIds: Set<string>

  // Actions
  setStep: (n: 1|2|3|4) => void
  selectSite: (id: string) => void
  selectProject: (id: string) => void
  selectQuote: (id: string) => void
  assignWorker: (taskId: string, workerId: string) => void
  unassignWorker: (taskId: string, workerId: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  handleSocketEvent: (event: KanbanSocketEvent) => void
}
```

### Drag Drop Setup
```typescript
// Worker drag source: DraggableWorkerCard
// Task drop target: TaskCard + KanbanColumn
// Column drag source + target: for reordering tasks

// DragDropContext onDragEnd:
function onDragEnd(result: DropResult) {
  const { source, destination, draggableId, type } = result
  if (!destination) return

  if (type === 'WORKER') {
    // Worker dragged from panel onto a task
    const taskId = destination.droppableId.replace('task-', '')
    assignWorker(taskId, draggableId)
  } else if (type === 'TASK') {
    // Task moved between columns
    const newStatus = destination.droppableId as TaskStatus
    moveTask(draggableId, newStatus)
  }
}
```

### Transfer Drawer Logic
```typescript
// TransferDrawer state machine:
// idle → selecting-site → selecting-project-quote → selecting-task → confirming

interface TransferState {
  workerId: string
  fromTaskId: string
  fromPath: string          // "Xưởng HN → Aeon HN → WS0087 → Hàn khung"
  targetSiteId: string | null
  targetProjectId: string | null
  targetQuoteId: string | null
  targetTaskId: string | null
  step: 1 | 2 | 3 | 4      // 4 = confirm
}

// On confirm:
async function confirmTransfer() {
  await transferMutation.mutateAsync({
    workerId, fromTaskId, toTaskId: targetTaskId
  })
  // optimistic update: move worker chip, update busyWorkerIds
  // socket will broadcast to other clients
}
```

## WebSocket Events
```typescript
type KanbanSocketEvent =
  | { type: 'assign';    taskId: string; workerId: string; assignment: TaskAssignment }
  | { type: 'unassign';  taskId: string; workerId: string }
  | { type: 'transfer';  fromTaskId: string; toTaskId: string; workerId: string }
  | { type: 'task_status_change'; taskId: string; status: TaskStatus }
  | { type: 'task_created'; task: Task }

// Room ID: `${siteId}-${date}` (all users viewing same site+date share room)
```
