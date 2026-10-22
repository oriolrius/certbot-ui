# Contributing to Certbot UI

Thank you for your interest in contributing to Certbot UI! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- Certbot (for testing)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd certbot-ui

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start development servers
npm run dev
```

## Project Structure

```
certbot-ui/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/         # Configuration management
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── __tests__/          # Backend tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── test/               # Frontend tests
└── docker-compose.yml      # Docker configuration
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow React best practices

### Backend

- Use async/await for asynchronous code
- Implement proper error handling
- Add input validation
- Write secure code (no SQL injection, XSS, etc.)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage --workspaces

# Run backend tests only
cd backend && npm test

# Run frontend tests only
cd frontend && npm test
```

### Writing Tests

- Write tests for new features
- Maintain or improve code coverage
- Test edge cases
- Use descriptive test names

Example test:

```typescript
describe('CertificateService', () => {
  it('should list all certificates', async () => {
    const certificates = await certbotService.listCertificates()
    expect(certificates).toBeInstanceOf(Array)
  })
})
```

## Pull Request Process

1. **Update Documentation**: Update README.md and relevant docs
2. **Add Tests**: Ensure new features have tests
3. **Run Linter**: Fix any linting errors
4. **Test Locally**: Verify everything works
5. **Write Clear Commits**: Use conventional commit messages
6. **Create PR**: Provide a clear description of changes

### Commit Message Format

```
type(scope): brief description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
- `feat(wizard): add multi-domain support`
- `fix(auth): resolve token expiration issue`
- `docs(readme): update installation steps`

## Security

### Reporting Security Issues

**Do not** create public issues for security vulnerabilities.

Instead, email security concerns to: [security email]

### Security Best Practices

- Never commit secrets or API keys
- Validate and sanitize all inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

## Code Review

### For Reviewers

- Be constructive and respectful
- Test the changes locally
- Check for security issues
- Verify tests pass
- Ensure documentation is updated

### For Contributors

- Respond to feedback promptly
- Be open to suggestions
- Ask questions if unclear
- Update PR based on feedback

## Style Guide

### JavaScript/TypeScript

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in multi-line objects/arrays

### CSS/Tailwind

- Use Tailwind classes when possible
- Keep custom CSS minimal
- Follow mobile-first approach
- Use semantic class names

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex logic
- Update API documentation for new endpoints
- Include examples in documentation

## Questions?

- Open a discussion on GitHub
- Check existing issues
- Review documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Thank You!

Your contributions make Certbot UI better for everyone. We appreciate your time and effort!
