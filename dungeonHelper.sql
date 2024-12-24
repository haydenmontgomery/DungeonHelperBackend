\echo 'Delete and recreate dungeon_helper db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE dungeon_helper;
CREATE DATABASE dungeon_helper;
\connect dungeon_helper

\i dungeonHelper-schema.sql
\i dungeonHelper-seed.sql

\echo 'Delete and recreate dungeon_helper_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE dungeon_helper_test;
CREATE DATABASE dungeon_helper_test;
\connect dungeon_helper_test

\i dungeonHelper-schema.sql
