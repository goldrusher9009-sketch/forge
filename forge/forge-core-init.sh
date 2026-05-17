#!/bin/bash
# Forge Core Repository Initialization - Clean Version

set -e

REPO_DIR="forge-core-temp"
rm -rf "$REPO_DIR" 2>/dev/null || true

# Create directory structure
mkdir -p "$REPO_DIR/forge-router/src"
mkdir -p "$REPO_DIR/forge-agent-runtime/src"
mkdir -p "$REPO_DIR/forge-cli/src"
mkdir -p "$REPO_DIR/forge-memory/src"
mkdir -p "$REPO_DIR/.github/workflows"

cd "$REPO_DIR"

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

# Create individual Cargo.toml files for each module
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

  # Create main.rs
  cat > "$PROJECT/src/main.rs" << EOF
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    info!("$PROJECT initialized");
    Ok(())
}
EOF

  # Create lib.rs
  cat > "$PROJECT/src/lib.rs" << EOF
pub mod errors;
pub use errors::*;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
EOF

  # Create errors module
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

Master Rust Monorepo for Forge AI Business Foundry.

Contains:
- **forge-router**: Model routing engine with complexity classifier
- **forge-agent-runtime**: Agent orchestration and clean-room execution
- **forge-cli**: Command-line interface for Forge operations
- **forge-memory**: Persistent memory system (working, episodic, semantic)

## Quick Start

```bash
cargo build --workspace
cargo test --workspace
cargo build --workspace --release
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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
EOF

# Create CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Forge Core

## Development Setup

1. Clone the repository
2. Install Rust: `rustup update`
3. Build: `cargo build`

## Commit Convention

```
feat(module): describe feature
fix(module): describe fix
docs: documentation changes
test: add tests
chore: maintenance
```

## Process

1. Create feature branch from staging
2. Commit with clear messages
3. Push and create PR
4. Address feedback
5. Merge when approved
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
/target/
Cargo.lock
**/*.rs.bk
*.pdb
.vscode/
.idea/
*.swp
*.swo
*~
.env
.env.local
.DS_Store
Thumbs.db
EOF

# Create GitHub Actions workflows
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
      - run: cargo test --workspace --verbose
      - run: cargo test --doc --workspace

  fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      - run: cargo fmt --all -- --check

  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo clippy --workspace --all-targets -- -D warnings
EOF

cat > .github/workflows/build.yml << 'EOF'
name: Build
on:
  push:
    branches: [main, staging]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo build --workspace --release
EOF

# Create Makefile
cat > Makefile << 'EOF'
.PHONY: build test lint fmt clean release

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

# Initialize git repo
git init --initial-branch=main
git config user.email "goldrusher9009@gmail.com"
git config user.name "Forge Build"
git add .
git commit -m "Initial commit: Forge Core workspace setup"

echo "✅ Forge Core initialized!"
echo "Workspace members: forge-router, forge-agent-runtime, forge-cli, forge-memory"
