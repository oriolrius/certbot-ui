---
id: task-006
title: New Certificate Wizard
status: Done
assignee:
  - '@claude'
created_date: '2025-10-13 07:15'
updated_date: '2025-10-13 07:26'
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
- [x] #1 Multi-step wizard component created
- [x] #2 Domain input and validation step implemented
- [x] #3 Plugin selection step (standalone, webroot, nginx, apache, etc.)
- [x] #4 Configuration options step (email, agreement to ToS)
- [x] #5 Review and confirm step showing command to be executed
- [x] #6 Progress indicator showing certificate acquisition status
- [x] #7 Success/error handling with clear messages
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created comprehensive certificate wizard:

- Multi-step wizard with 4 steps plus success screen
- Domain input with add/remove functionality
- Plugin selection with descriptions
- Webroot path configuration for webroot plugin
- Email and ToS agreement
- Staging environment option
- Review step showing all configuration
- Success screen with navigation
- Progress tracking with step indicator
- Form validation at each step
- Integration with obtain certificate mutation
<!-- SECTION:NOTES:END -->
