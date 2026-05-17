#!/bin/bash
# Forge Core Repository Initialization Script
# Sets up the master Rust monorepo with workspace structure

set -e

REPO_DIR="forge-core-temp"

# Create directory structure
mkdir -p "$REPO_DIR/forge-router/src"
mkdir -p "$REPO_DIR/forge-agent-runtime/src"
mkdir -p "$REPO_DIR/forge-cli/src"
mkdir -p "$REPO_DIR/forge-memory/src"
mkdir -p "$REPO_DIR/.github/workflows"

cd "$REPO_DIR"

# Initialize git
git init
git config user.name "Forge Build System"
git config user.email "goldrusher9009@gmail.com"

# Create workspace Cargo.toml (root)
cat > Cargo.toml << 'EOF'
[workspace]
members = ["forge-router", "forge-agent-runtime", "forge-cli", "forge-memory"]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Scott <goldrusher9009@gmail.com>"]
license = "MIT OR Apache-2.0"
repository = "https://github.com/goldrusher9009-sketch/forge-core"

[workspace.dependencies]
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.12", features = ["json"] }
tracing = "0.1"
tracing-subscriber = "0.3"
thiserror = "1.0"
anyhow = "1.0"
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite", "postgres"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
dotenv = "0.15"
async-trait = "0.1"
futures = "0.3"

EOF

# Create individual Cargo.toml files
for PROJECT in forge-router forge-agent-runtime forge-cli forge-memory; do
  cat > "$PROJECT/Cargo.toml" << EOF
[package]
name = "$PROJECT"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
tokio = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
reqwest = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
thiserror = { workspace = true }
anyhow = { workspace = true }
sqlx = { workspace = true }
uuid = { workspace = true }
chrono = { workspace = true }
dotenv = { workspace = true }
async-trait = { workspace = true }
futures = { workspace = true }

[dev-dependencies]
tokio-test = "0.4"
EOF

  # Create main.rs placeholder
  cat > "$PROJECT/src/main.rs" << EOF
// $PROJECT - Forge Core Module
// Auto-generated scaffold

use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    info!("$PROJECT initialized");

    Ok(())
}
EOF

  # Create lib.rs placeholder
  cat > "$PROJECT/src/lib.rs" << EOF
// $PROJECT library
pub mod errors;

pub use errors::*;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
EOF

  # Create errors module
  mkdir -p "$PROJECT/src"
  cat > "$PROJECT/src/errors.rs" << EOF
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Runtime error: {0}")]
    RuntimeError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, Error>;
EOF

done

# Create README.md
cat > README.md << 'EOF'
# Forge Core

**Master Rust Monorepo** for the Forge AI Business Foundry platform.

Contains four core modules:
- **forge-router**: Model routing engine with complexity classifier
- **forge-agent-runtime**: Agent orchestration and clean-room execution
- **forge-cli**: Command-line interface for Forge operations
- **forge-memory**: Persistent memory system (working, episodic, semantic)

## Quick Start

```bash
# Build all modules
cargo build --workspace

# Run tests
cargo test --workspace

# Build release binaries
cargo build --workspace --release
```

## Development

```bash
# Watch mode (requires cargo-watch)
cargo watch -x build

# Run with logging
RUST_LOG=debug cargo run

# Format code
cargo fmt --all

# Lint
cargo clippy --all --all-targets
```

## License

MIT OR Apache-2.0
EOF

# Create LICENSE (MIT)
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Scott Goldrusher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Forge Core

We welcome contributions to the Forge platform! Here's how to get started.

## Development Setup

1. Clone the repository
2. Install Rust: `rustup update`
3. Install dependencies: `cargo build`
4. Make changes
5. Run tests: `cargo test`

## Commit Convention

```
feat(module): describe feature
fix(module): describe fix
docs: documentation changes
test: add tests
chore: maintenance
```

## Pull Request Process

1. Create feature branch from `staging`
2. Make commits with clear messages
3. Push to your fork
4. Create PR with description
5. Address code review feedback
6. Merge when approved

## Code Standards

- Run `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Write tests for new features
- Update docs as needed

## Questions?

Open an issue or reach out to the maintainers.
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Rust
/target/
Cargo.lock
**/*.rs.bk
*.pdb

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db
EOF

# Create GitHub Actions workflow template
mkdir -p .github/workflows

cat > .github/workflows/test.yml << 'EOF'
name: Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2

      - name: Run tests
        run: cargo test --workspace --verbose

      - name: Run doctests
        run: cargo test --doc --workspace

  fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt

      - name: Check formatting
        run: cargo fmt --all -- --check

  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2

      - name: Run clippy
        run: cargo clippy --workspace --all-targets -- -D warnings
EOF

cat > .github/workflows/build.yml << 'EOF'
name: Build

on:
  push:
    branches: [main, staging]
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2

      - name: Build release
        run: cargo build --workspace --release

      - name: Create release artifacts
        if: startsWith(github.ref, 'refs/tags/')
        run: |
          mkdir -p artifacts
          cp target/release/forge-router artifacts/ || true
          cp target/release/forge-agent-runtime artifacts/ || true
          cp target/release/forge-cli artifacts/ || true

      - name: Upload artifacts
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/upload-artifact@v3
        with:
          name: forge-core-${{ github.ref_name }}
          path: artifacts/
EOF

# Create Makefile
cat > Makefile << 'EOF'
.PHONY: help build test lint fmt clean release

help:
	@echo "Forge Core - Available targets:"
	@echo "  make build     - Build all modules"
	@echo "  make test      - Run tests"
	@echo "  make lint      - Run clippy"
	@echo "  make fmt       - Format code"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make release   - Build release binaries"

build:
	cargo build --workspace

test:
	cargo test --workspace

lint:
	cargo clippy --workspace --all-targets -- -D warnings

fmt:
	cargo fmt --all

clean:
	cargo clean

release:
	cargo build --workspace --release
EOF

# Initialize git repository
git add .
git commit -m "Initial commit: Forge Core workspace setup"

# Create main branch
git branch -M main

echo "✅ Forge Core repository initialized successfully!"
echo "📦 Workspace members:"
echo "   - forge-router"
echo "   - forge-agent-runtime"
echo "   - forge-cli"
echo "   - forge-memory"
echo ""
echo "Next: Push to GitHub with 'git push -u origin main'"
