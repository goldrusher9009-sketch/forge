// ============================================================================
// UNIT TESTS: ERROR HANDLING
// ============================================================================

#[cfg(test)]
mod tests {
    use crate::error::AppError;

    #[test]
    fn test_not_found_error() {
        let err = AppError::NotFound("Resource not found".to_string());
        let msg = err.to_string();
        assert!(msg.contains("not found") || msg.contains("NotFound"));
    }

    #[test]
    fn test_database_error() {
        let err = AppError::DatabaseError("Connection failed".to_string());
        let msg = err.to_string();
        assert!(msg.contains("Database") || msg.contains("Connection"));
    }

    #[test]
    fn test_serialization_error() {
        let err = AppError::SerializationError("Invalid JSON".to_string());
        let msg = err.to_string();
        assert!(msg.contains("Serialization") || msg.contains("JSON"));
    }

    #[test]
    fn test_validation_error() {
        let err = AppError::ValidationError("Invalid input".to_string());
        let msg = err.to_string();
        assert!(msg.contains("Validation") || msg.contains("Invalid"));
    }

    #[test]
    fn test_internal_error() {
        let err = AppError::InternalError("Something went wrong".to_string());
        let msg = err.to_string();
        assert!(msg.contains("Internal") || msg.contains("wrong"));
    }

    #[test]
    fn test_error_chain() {
        let db_err = AppError::DatabaseError("DB connection failed".to_string());
        let msg = format!("Operation failed: {}", db_err);
        assert!(msg.contains("DB"));
    }
}
