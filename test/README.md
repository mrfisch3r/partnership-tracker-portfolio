# Token System Tests

This folder contains unit tests for the token authentication system.

## Backend Tests (`test_token.py`)

Tests the Flask API endpoints for token generation and verification.

**Run with:**

```bash
source venv/bin/activate
pytest test/test_token.py -v
```

**Tests:**

- `test_get_token` - Tests getting a token from login endpoint
- `test_verify_token` - Tests verifying a valid token
- `test_verify_invalid_token` - Tests handling invalid tokens
  cd
