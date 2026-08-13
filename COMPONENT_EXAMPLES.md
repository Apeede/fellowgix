# Component Examples & Usage Patterns

## Quick Reference

### All Component Imports

```typescript
import {
  // Loading & Empty States
  Skeleton,
  CardSkeleton,
  CardGridSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  TableSkeleton,
  EmptyState,
  EmptyPage,

  // Navigation
  Breadcrumbs,
  NavHeader,

  // Status & Feedback
  StatusBadge,
  EventStatusBadge,
  AttendanceStatusBadge,
  ConfirmDialog,
  useConfirmDialog,

  // Actions
  QuickActionCard,
  QuickActionGrid,
} from "@components";

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  truncateText,
  capitalize,
  formatRole,
  formatFileSize,
  formatPhoneNumber,
} from "@utils";
```

---

## 1. LoadingSkeleton Examples

### Example 1.1: Card Grid Loading (Events Page)

```typescript
import { CardGridSkeleton } from '@components';

const EventsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && <CardGridSkeleton count={4} />}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Example 1.2: List Item Loading

```typescript
import { ListSkeleton } from '@components';

const MembersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  return (
    <div>
      {isLoading && <ListSkeleton count={5} />}
      {!isLoading && (
        <div className="space-y-3">
          {members.map(member => (
            <MemberListItem key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Example 1.3: Table Loading

```typescript
import { TableSkeleton } from '@components';

const AttendanceTable: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  return (
    <div>
      {isLoading && <TableSkeleton rows={8} columns={5} />}
      {!isLoading && (
        <table className="w-full">
          {/* table content */}
        </table>
      )}
    </div>
  );
};
```

---

## 2. EmptyState Examples

### Example 2.1: Full Page Empty State

```typescript
import { EmptyPage, EmptyState } from '@components';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <EmptyPage
        icon={Calendar}
        title="No events created yet"
        description="Create your first event to start tracking attendance and engagement"
        action={{
          label: 'Create Event',
          onClick: () => navigate('/events/create'),
        }}
      />
    );
  }

  return <div>{/* event list */}</div>;
};
```

### Example 2.2: Inline Empty State

```typescript
import { EmptyState } from '@components';
import { Users } from 'lucide-react';

const MembersList: React.FC<{ members: Member[] }> = ({ members }) => {
  return (
    <div className="card">
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members in this club"
          description="Add members to start tracking their attendance"
          action={{
            label: 'Add Member',
            onClick: () => navigate('/members/add'),
          }}
        />
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Example 2.3: No Action Empty State

```typescript
import { EmptyState } from '@components';
import { Search } from 'lucide-react';

const SearchResults: React.FC<{ results: any[] }> = ({ results }) => {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description="Try adjusting your search terms"
        // No action button - user needs to try again
      />
    );
  }

  return <div>{/* results */}</div>;
};
```

---

## 3. Breadcrumbs Examples

### Example 3.1: Simple Breadcrumb Trail

```typescript
import { Breadcrumbs } from '@components';

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams();
  const event = useEvent(eventId);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Events', path: '/events' },
          { label: event?.name || 'Loading...', path: null },
        ]}
      />
      {/* page content */}
    </div>
  );
};
```

### Example 3.2: Nested Breadcrumbs

```typescript
<Breadcrumbs
  items={[\n    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Events', path: '/events' },
    { label: 'Event Name', path: '/events/123' },
    { label: 'Analytics', path: null }, // Current page
  ]}
/>
```

### Example 3.3: Dynamic Breadcrumbs

```typescript
const EventAnalyticsPage: React.FC = () => {
  const { eventId } = useParams();
  const event = useEvent(eventId);

  const breadcrumbItems = event
    ? [
        { label: 'Events', path: '/events' },
        { label: event.name, path: `/events/${event.id}` },
        { label: 'Analytics', path: null },
      ]
    : [];

  return (
    <div>
      {breadcrumbItems.length > 0 && <Breadcrumbs items={breadcrumbItems} />}
      {/* page content */}
    </div>
  );
};
```

---

## 4. Status Badge Examples

### Example 4.1: Event Status Badge

```typescript
import { EventStatusBadge } from '@components';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const now = new Date();
  const isUpcoming = event.startDate > now;
  const isPast = event.endDate < now;
  const isActive = !isUpcoming && !isPast;

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <h3>{event.name}</h3>
        <EventStatusBadge
          isActive={isActive}
          isUpcoming={isUpcoming}
          isPast={isPast}
        />
      </div>
      {/* rest of card */}
    </div>
  );
};
```

### Example 4.2: Attendance Status Badge

```typescript
import { AttendanceStatusBadge } from '@components';

const AttendanceRow: React.FC<{ record: AttendanceRecord }> = ({ record }) => {
  return (
    <div className="flex justify-between items-center p-4">
      <span>{record.memberName}</span>
      <AttendanceStatusBadge status={record.status} />
    </div>
  );
};
```

### Example 4.3: Generic Status Badges

```typescript
import { StatusBadge } from '@components';

const DataGrid: React.FC = () => {
  return (
    <div className="space-y-2">
      <StatusBadge status="success" label="Completed" size="sm" />
      <StatusBadge status="warning" label="Pending" size="md" />
      <StatusBadge status="error" label="Failed" size="lg" />
      <StatusBadge status="info" label="Information" size="sm" />
      <StatusBadge status="loading" label="Processing..." />
    </div>
  );
};
```

---

## 5. ConfirmDialog Examples

### Example 5.1: Delete Event Confirmation

```typescript
import { useConfirmDialog } from '@components';
import { toast } from 'react-hot-toast';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Delete Event?',
      message: `Are you sure you want to delete "${event.name}"? This action cannot be undone. All attendance records will be permanently deleted.`,
      confirmLabel: 'Delete Event',
      cancelLabel: 'Keep Event',
      isLoading: false,
    });

    if (confirmed) {
      try {
        await eventService.deleteEvent(event.id);
        toast.success('Event deleted successfully');
        navigate('/events');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  return (
    <>
      {ConfirmDialogComponent}
      <button onClick={handleDelete} className="btn-danger">
        Delete Event
      </button>
    </>
  );
};
```

### Example 5.2: Warning Confirmation

```typescript
const handleBulkDelete = async () => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const confirmed = await confirm({
    type: "warning",
    title: "Mark All as Attended?",
    message: "This will update all marked members as attended for this event.",
    confirmLabel: "Mark All",
    cancelLabel: "Cancel",
  });

  if (confirmed) {
    // perform action
  }
};
```

### Example 5.3: Info Confirmation

```typescript
const handleArchiveEvent = async () => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const confirmed = await confirm({
    type: "info",
    title: "Archive Event?",
    message: "Archived events are hidden but can be restored later.",
    confirmLabel: "Archive",
    cancelLabel: "Keep Visible",
  });

  if (confirmed) {
    // perform action
  }
};
```

### Example 5.4: Async Operation with Loading

```typescript
const handleSave = async () => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(false);

  const confirmed = await confirm({
    type: "success",
    title: "Save Changes?",
    message: "Your changes will be saved to the server.",
    confirmLabel: "Save",
    cancelLabel: "Discard",
    isLoading,
  });

  if (confirmed) {
    setIsLoading(true);
    try {
      await saveChanges();
      toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  }
};
```

---

## 6. NavHeader Examples

### Example 6.1: Simple Header with Title

```typescript
import { NavHeader } from '@components';

const EventsPage: React.FC = () => {
  return (
    <div>
      <NavHeader
        title="Events"
        description="Manage your Rotaract club events"
      />
      {/* page content */}
    </div>
  );
};
```

### Example 6.2: Header with Actions

```typescript
import { NavHeader } from '@components';
import { Plus } from 'lucide-react';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <NavHeader
        title="Events"
        description="Manage your Rotaract club events"
        actions={
          <button
            onClick={() => navigate('/events/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        }
      />
      {/* page content */}
    </div>
  );
};
```

### Example 6.3: Header with Breadcrumbs

```typescript
import { NavHeader } from '@components';

const EventAnalyticsPage: React.FC = () => {
  return (
    <NavHeader
      title="Event Analytics"
      description="View detailed event analytics and insights"
      breadcrumbs={[
        { label: 'Events', path: '/events' },
        { label: 'Event Name', path: '/events/123' },
        { label: 'Analytics', path: null },
      ]}
    />
  );
};
```

---

## 7. QuickActionCard Examples

### Example 7.1: Single Action Card

```typescript
import { QuickActionCard } from '@components';
import { Plus, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <QuickActionCard
      icon={Calendar}
      title="Create Event"
      description="Start tracking a new event"
      badge={{ label: 'New', variant: 'primary' }}
      onClick={() => navigate('/events/create')}
    />
  );
};
```

### Example 7.2: Action Grid

```typescript
import { QuickActionGrid } from '@components';
import { Plus, Users, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      title: 'Create Event',
      description: 'Start a new event',
      onClick: () => navigate('/events/create'),
      badge: { label: 'Quick', variant: 'primary' },
    },
    {
      icon: Users,
      title: 'Add Members',
      description: 'Invite new members',
      onClick: () => navigate('/members/add'),
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'See club insights',
      onClick: () => navigate('/analytics/club'),
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure club',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <QuickActionGrid
      columns={2} // 2 on mobile, auto on larger
      actions={actions}
    />
  );
};
```

### Example 7.3: Disabled Action

```typescript
<QuickActionCard
  icon={ShieldCheck}
  title="Admin Settings"
  description="Manage club admins"
  disabled={!canManageAdmins}
  onClick={() => navigate('/admin')}
/>
```

---

## 8. Format Utilities Examples

### Example 8.1: Date Formatting

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@utils';

// Formatting dates
const event = {
  startDate: new Date('2026-08-13'),
  createdAt: new Date('2024-01-15T14:30:00'),
};

console.log(formatDate(event.startDate));        // "Aug 13, 2026"
console.log(formatDateTime(event.createdAt));    // "Jan 15, 2024, 2:30 PM"
console.log(formatRelativeTime(event.createdAt)); // "2 months ago"

// In JSX
<div className="event-item">
  <h3>{event.name}</h3>
  <p>Event Date: {formatDate(event.startDate)}</p>
  <p>Created: {formatRelativeTime(event.createdAt)}</p>
</div>
```

### Example 8.2: Number Formatting

```typescript
import { formatNumber, formatPercent } from '@utils';

const stats = {
  totalAttendees: 1234567,
  attendanceRate: 0.857,
};

console.log(formatNumber(stats.totalAttendees));  // "1,234,567"
console.log(formatPercent(stats.attendanceRate));  // "85.7%"

// In JSX
<div className="stats-card">
  <p>Total Attendees: {formatNumber(stats.totalAttendees)}</p>
  <p>Attendance Rate: {formatPercent(stats.attendanceRate)}</p>
</div>
```

### Example 8.3: Text Formatting

```typescript
import { truncateText, capitalize, formatRole } from '@utils';

const data = {
  name: 'john doe',
  description: 'This is a very long description that needs to be truncated',
  role: 'club_admin',
};

console.log(capitalize(data.name));              // "John doe"
console.log(truncateText(data.description, 40)); // "This is a very long description tha..."
console.log(formatRole(data.role));              // "Club Admin"

// In JSX
<div className="member-card">
  <h3>{capitalize(member.name)}</h3>
  <p>{truncateText(member.bio, 100)}</p>
  <span className="badge">{formatRole(member.role)}</span>
</div>
```

### Example 8.4: Firestore Timestamp Handling

```typescript
import { formatDate, formatRelativeTime } from "@utils";

// Firebase returns Timestamp objects with toDate() method
const firestoreDoc = {
  id: "event123",
  createdAt: {
    toDate: () => new Date("2024-01-15"),
  },
};

// Both Date objects and Firestore Timestamps work the same
console.log(formatDate(firestoreDoc.createdAt)); // "Jan 15, 2024"
console.log(formatRelativeTime(firestoreDoc.createdAt)); // "5 months ago"
```

### Example 8.5: File Size and Phone Formatting

```typescript
import { formatFileSize, formatPhoneNumber } from "@utils";

const data = {
  fileSize: 2621440, // 2.5 MB
  phone: "1234567890",
};

console.log(formatFileSize(data.fileSize)); // "2.5 MB"
console.log(formatPhoneNumber(data.phone)); // "(123) 456-7890"
```

---

## Integration Patterns

### Pattern 1: Loading + Empty State

```typescript
const EventsList: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  return (
    <div>
      {isLoading && <CardGridSkeleton count={4} />}
      {!isLoading && events.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No events"
          action={{ label: 'Create', onClick: create }}
        />
      )}
      {!isLoading && events.length > 0 && (
        <div className="grid...">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
};
```

### Pattern 2: Confirmation + Async Operation

```typescript
const handleDelete = async () => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const confirmed = await confirm({
    type: "danger",
    title: "Delete?",
    message: "This cannot be undone.",
  });

  if (confirmed) {
    try {
      setIsDeleting(true);
      await deleteItem();
      toast.success("Deleted!");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }
};
```

### Pattern 3: List with Formatting and Status

```typescript
const EventList: React.FC = () => {
  return (
    <div className="space-y-2">
      {events.map(event => (
        <div key={event.id} className="flex justify-between items-center">
          <div>
            <h4>{event.name}</h4>
            <p className="text-sm text-gray-600">
              {formatDate(event.startDate)} •{' '}
              {formatRelativeTime(event.createdAt)}
            </p>
          </div>
          <EventStatusBadge {...status} />
        </div>
      ))}
    </div>
  );
};
```

---

## Testing These Components

### Test Skeleton Loading

1. Go to Events page
2. Should see shimmer skeleton while loading
3. Content appears when loaded

### Test Empty States

1. Create club with no events
2. Go to Events page
3. Should see friendly empty state with create button

### Test Confirmation Dialog

1. Hover over any delete button
2. Click to delete
3. Professional dialog appears (not browser alert)

### Test Formatting

1. View any page with dates
2. Dates should be formatted as "Aug 13, 2026"
3. Numbers should have commas (1,234)

### Test Status Badges

1. View Events page
2. Events should show colored badges (Active/Upcoming/Past)
3. Badges should update in real-time

---

## Common Patterns Summary

| Use Case       | Component          | Example                    |
| -------------- | ------------------ | -------------------------- |
| List loading   | `ListSkeleton`     | EventsList with async load |
| Grid loading   | `CardGridSkeleton` | Dashboard stats            |
| No data        | `EmptyState`       | Empty events list          |
| Navigation     | `Breadcrumbs`      | Event detail pages         |
| Status display | `StatusBadge`      | Event status indicator     |
| Confirmation   | `useConfirmDialog` | Delete operations          |
| Page header    | `NavHeader`        | All main pages             |
| Quick actions  | `QuickActionGrid`  | Dashboard                  |
| Date display   | `formatDate`       | Event timestamps           |
| Number display | `formatNumber`     | Attendance counts          |
