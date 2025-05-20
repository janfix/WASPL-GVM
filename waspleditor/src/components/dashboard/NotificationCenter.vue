<template>
    <div class="dashbordBlock">🔔 Notifications</div>
    <section class="notification-center">
      <ul class="notification-list">
        <!-- Example static items -->
        <li class="notification-item expired">
          <span class="icon">⏲️</span>
          <span class="message">Evaluation "<strong>History - Revolutions</strong>" has expired.</span>
          <span class="timestamp">2h ago</span>
        </li>
        <li class="notification-item all-submitted">
          <span class="icon">✅</span>
          <span class="message">All students have submitted "<strong>Math Test A</strong>".</span>
          <span class="timestamp">Today</span>
        </li>
        <li class="notification-item ai-correction">
          <span class="icon">🤖</span>
          <span class="message">AI correction finished for "<strong>Science Test</strong>".</span>
          <span class="timestamp">1d ago</span>
        </li>
        <li class="notification-item group-validated">
          <span class="icon">👥</span>
          <span class="message">Group "<strong>Group B</strong>" has been validated.</span>
          <span class="timestamp">Just now</span>
        </li>
      </ul>
    </section>
  </template>
  <style scoped>


  .notification-center {
  background: #ffffff;
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.9rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.notification-title {
    text-align: left;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: bold;
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-left: 4px solid #0d6efd;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.notification-item .icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notification-item .message {
  flex-grow: 1;
  color: #222;
}

.notification-item .timestamp {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
}

/* Custom colors per type */
.notification-item.expired { border-color: #dc3545; }
.notification-item.all-submitted { border-color: #198754; }
.notification-item.ai-correction { border-color: #0dcaf0; }
.notification-item.human-correction { border-color: #6f42c1; }
.notification-item.group-validated { border-color: #0d6efd; }
.notification-item.invites-sent { border-color: #ffc107; }
.notification-item.report-sent { border-color: #20c997; }

  </style>