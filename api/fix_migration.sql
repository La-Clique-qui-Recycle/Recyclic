UPDATE alembic_version SET version_num = 'afbbc7f0e804';
SELECT version_num FROM alembic_version;
SELECT table_name FROM information_schema.tables WHERE table_name = 'cash_sessions';
