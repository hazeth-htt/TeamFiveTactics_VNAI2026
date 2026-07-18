# processors/__init__.py
from .pg_writer import upsert_career_to_pg, ensure_table_exists
from .pinecone_uploader import upsert_to_pinecone
