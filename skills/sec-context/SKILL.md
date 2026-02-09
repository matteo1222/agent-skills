---
name: sec-context
description: Security anti-patterns reference for AI-generated code. Covers 25+ vulnerabilities with BAD/GOOD examples, CWE references, and mitigations. Use during code review or before writing security-sensitive code.
---

# Sec-Context: AI Code Security Anti-Patterns

Security reference to help generate safer code. Distilled from 150+ sources documenting patterns AI consistently gets wrong.

## Why This Matters

- 97% of developers use AI tools
- 40%+ of codebases are AI-generated
- 86% XSS failure rate in AI code
- 72% of Java AI code contains vulnerabilities
- 81% of orgs have shipped vulnerable AI code to production

## Quick Reference: Top 10 AI Anti-Patterns

| Rank | Pattern | CWE | Severity | Quick Fix |
|------|---------|-----|----------|-----------|
| 1 | Dependency Risks (Slopsquatting) | CWE-829 | Critical | Verify packages exist before installing |
| 2 | XSS Vulnerabilities | CWE-79 | High | Use framework auto-escaping, CSP headers |
| 3 | Hardcoded Secrets | CWE-798 | Critical | Environment variables, secrets manager |
| 4 | SQL Injection | CWE-89 | Critical | Parameterized queries only |
| 5 | Authentication Failures | CWE-287 | Critical | Use established auth libraries |
| 6 | Missing Input Validation | CWE-20 | High | Validate all external input at boundaries |
| 7 | Command Injection | CWE-78 | Critical | Avoid shell; use safe subprocess APIs |
| 8 | Missing Rate Limiting | CWE-770 | Medium | Add rate limits to all public endpoints |
| 9 | Excessive Data Exposure | CWE-200 | Medium | Return minimal data, filter sensitive fields |
| 10 | Unrestricted File Upload | CWE-434 | High | Validate type, size, store outside webroot |

## Usage

### Security Review Mode

When reviewing AI-generated code, check for these patterns:

```
/sec-context review
```

Systematic checklist:
1. [ ] Secrets - No hardcoded passwords, API keys, tokens
2. [ ] SQL - All queries use parameterized statements
3. [ ] XSS - User input escaped before rendering
4. [ ] Auth - Session tokens are secure, passwords hashed properly
5. [ ] Input - All external data validated
6. [ ] Commands - No shell execution with user input
7. [ ] Files - Upload restrictions enforced
8. [ ] Dependencies - All packages verified to exist
9. [ ] Crypto - Using modern algorithms (not MD5, SHA1)
10. [ ] Data - Minimal exposure, no over-fetching

### Pre-Implementation Mode

Before writing security-sensitive code:

```
/sec-context [category]
```

Categories: `secrets`, `injection`, `xss`, `auth`, `crypto`, `input`, `files`, `api`

## Critical Anti-Patterns with Examples

### 1. Hardcoded Secrets (CWE-798)

```python
# BAD: Hardcoded credentials
db = connect(
    host="prod.db.example.com",
    password="super_secret_123"  # Scraped within minutes of commit
)

api_key = "sk-live-abc123xyz"  # Will be found by secret scanners
```

```python
# GOOD: Environment variables + secrets manager
import os
from secrets_manager import get_secret

db = connect(
    host=os.environ["DB_HOST"],
    password=get_secret("db-password")
)

api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError("API_KEY environment variable required")
```

### 2. SQL Injection (CWE-89)

```python
# BAD: String concatenation
def get_user(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return db.execute(query)  # username = "admin'--" bypasses auth

# BAD: Format strings
query = "SELECT * FROM users WHERE id = %s" % user_id
```

```python
# GOOD: Parameterized queries
def get_user(username):
    query = "SELECT * FROM users WHERE username = ?"
    return db.execute(query, (username,))

# GOOD: ORM with parameter binding
user = User.query.filter_by(username=username).first()
```

### 3. XSS - Cross-Site Scripting (CWE-79)

```javascript
// BAD: Direct DOM insertion
element.innerHTML = userInput;  // <script>alert('xss')</script>

// BAD: Template without escaping
const html = `<div>${user.bio}</div>`;

// BAD: React dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userContent}} />
```

```javascript
// GOOD: Use textContent for text
element.textContent = userInput;

// GOOD: Let framework escape
// React auto-escapes: <div>{user.bio}</div>
// Vue auto-escapes: <div>{{ user.bio }}</div>

// GOOD: If HTML needed, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}} />
```

### 4. Command Injection (CWE-78)

```python
# BAD: Shell execution with user input
import os
os.system(f"convert {filename} output.png")  # filename=";rm -rf /"

# BAD: subprocess with shell=True
subprocess.run(f"ping {host}", shell=True)
```

```python
# GOOD: Use arrays, avoid shell
import subprocess
import shlex

# Pass arguments as array
subprocess.run(["convert", filename, "output.png"])

# If shell needed, use shlex.quote
subprocess.run(f"ping {shlex.quote(host)}", shell=True)

# Better: Use libraries instead of shell commands
from PIL import Image
img = Image.open(filename)
img.save("output.png")
```

### 5. Authentication Failures (CWE-287)

```python
# BAD: Weak password hashing
import hashlib
password_hash = hashlib.md5(password.encode()).hexdigest()

# BAD: No salt
password_hash = hashlib.sha256(password.encode()).hexdigest()

# BAD: Timing attack vulnerable comparison
if user.password_hash == provided_hash:
    return True
```

```python
# GOOD: Use bcrypt/argon2
import bcrypt

# Hashing (includes salt automatically)
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# Verification (timing-safe)
if bcrypt.checkpw(provided_password.encode(), stored_hash):
    return True

# GOOD: Use established auth libraries
# Flask-Login, Django auth, Passport.js, etc.
```

### 6. Dependency Slopsquatting (CWE-829)

AI models frequently hallucinate package names that don't exist. Attackers register these names with malicious code.

```bash
# BAD: Installing AI-suggested packages without verification
npm install react-data-vizualization  # Typo - may be malicious
pip install python-dateutils  # Real package is python-dateutil
```

```bash
# GOOD: Verify packages exist and are legitimate
# 1. Check npm/pypi directly
npm view react-data-visualization  # Does it exist?

# 2. Check download counts (low = suspicious)
# 3. Check repository (missing = red flag)
# 4. Check publish date (brand new + AI suggested = danger)

# 5. Use lockfiles
npm ci  # Install from lockfile only
pip install -r requirements.txt --require-hashes
```

### 7. Cryptographic Failures (CWE-327)

```python
# BAD: Weak/broken algorithms
import hashlib
hashlib.md5(data)  # Broken
hashlib.sha1(data)  # Weak

# BAD: ECB mode
from Crypto.Cipher import AES
cipher = AES.new(key, AES.MODE_ECB)  # Patterns visible

# BAD: Hardcoded IV
iv = b'0000000000000000'
```

```python
# GOOD: Modern algorithms
import hashlib
hashlib.sha256(data)  # For general hashing
hashlib.blake2b(data)  # Faster alternative

# GOOD: For passwords, use dedicated libraries
import bcrypt
bcrypt.hashpw(password, bcrypt.gensalt())

# GOOD: Proper encryption
from cryptography.fernet import Fernet
key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(data)
```

### 8. Input Validation (CWE-20)

```python
# BAD: No validation
def process_order(quantity, price):
    total = quantity * price
    return charge_card(total)  # quantity=-100 gives refund

# BAD: Client-side only validation
# Server trusts whatever client sends
```

```python
# GOOD: Server-side validation at boundaries
def process_order(quantity, price):
    # Type validation
    if not isinstance(quantity, int) or not isinstance(price, (int, float)):
        raise ValueError("Invalid types")

    # Range validation
    if quantity < 1 or quantity > 1000:
        raise ValueError("Quantity must be 1-1000")

    if price < 0:
        raise ValueError("Price cannot be negative")

    total = quantity * price
    return charge_card(total)

# GOOD: Use validation libraries
from pydantic import BaseModel, Field

class Order(BaseModel):
    quantity: int = Field(ge=1, le=1000)
    price: float = Field(ge=0)
```

## Integration Patterns

### Pre-commit Hook

```bash
# Check for hardcoded secrets before commit
git diff --cached --name-only | xargs grep -l -E "(password|api_key|secret)\s*=\s*['\"][^'\"]+['\"]"
```

### Code Review Prompt

When reviewing code, ask:
1. Where does external input enter the system?
2. How is that input validated?
3. Are SQL queries parameterized?
4. Are secrets in environment variables?
5. Is output properly escaped?

### Security-Focused Development

Before writing security-sensitive code:
1. Identify trust boundaries
2. Document expected input formats
3. Use established libraries over custom implementations
4. Apply principle of least privilege
5. Log security events

## Full Reference Documents

For comprehensive coverage, read the full documents included with this skill:

**Breadth Document** (7k lines) - 25+ patterns, quick reference:
```
{baseDir}/ANTI_PATTERNS_BREADTH.md
```

**Depth Document** (7.6k lines) - 7 critical patterns, deep analysis:
```
{baseDir}/ANTI_PATTERNS_DEPTH.md
```

Use these when you need:
- Complete BAD/GOOD examples for a specific pattern
- Edge cases and bypass techniques
- Framework-specific guidance
- Full attack scenarios

## When to Use This Skill

- **Before writing**: Auth, payments, file handling, database queries, API endpoints
- **During review**: Any AI-generated code touching user data or external input
- **After incidents**: Identify patterns that led to vulnerabilities
- **Training**: Educate team on AI-specific security blindspots

## Key Insight

AI models are trained on code that includes vulnerabilities. They reproduce patterns from training data without understanding security implications. The goal isn't to replace human security review - it's to catch the obvious, well-documented anti-patterns that AI consistently reproduces.

## Resources

- [Sec-Context Repository](https://github.com/Arcanum-Sec/sec-context)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Database](https://cwe.mitre.org/)
- [Arcanum Security](https://arcanum-sec.com)
