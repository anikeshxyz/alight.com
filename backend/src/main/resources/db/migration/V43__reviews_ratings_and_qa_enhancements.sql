-- ==========================================================
-- Stage 17: Reviews, Ratings, UGC & Product Q&A Performance Enhancements
-- ==========================================================

-- 1. Composite & Filtered Indexes for High-Traffic Catalog Queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_verified_status 
    ON reviews(product_id, is_verified_purchase, status);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor_status_created 
    ON reviews(vendor_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
    ON reviews(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_product_status_upvotes 
    ON product_questions(product_id, status, upvotes DESC);

CREATE INDEX IF NOT EXISTS idx_answers_question_accepted_upvotes 
    ON product_answers(question_id, is_accepted, upvotes DESC);
