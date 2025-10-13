---
id: task-006
title: New Certificate Wizard
status: In Progress
assignee:
  - '@claude'
created_date: '2025-10-13 07:15'
updated_date: '2025-10-13 07:25'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a step-by-step wizard for obtaining new SSL/TLS certificates. Should guide users through domain validation, plugin selection, and configuration options.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Multi-step wizard component created
- [ ] #2 Domain input and validation step implemented
- [ ] #3 Plugin selection step (standalone, webroot, nginx, apache, etc.)
- [ ] #4 Configuration options step (email, agreement to ToS)
- [ ] #5 Review and confirm step showing command to be executed
- [ ] #6 Progress indicator showing certificate acquisition status
- [ ] #7 Success/error handling with clear messages
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create multi-step wizard component
2. Domain input step with validation
3. Plugin selection step
4. Configuration options step
5. Review and confirm step
6. Progress indicator for certificate acquisition
7. Error handling with clear messages
8. Write tests
<!-- SECTION:PLAN:END -->
