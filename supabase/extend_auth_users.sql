-- Extend auth.users with generated metadata columns
-- This migration exposes `display_name` and `role` stored in `raw_user_meta_data`
-- so they can be queried directly without JSON operators.

alter table auth.users
  add column display_name text generated always as (raw_user_meta_data->>'display_name') stored,
  add column role text generated always as (raw_user_meta_data->>'role') stored;
