pub mod errors;
pub use errors::*;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
