from logging.config import fileConfig
from alembic import context
from app.core.config import settings
from app.core.database import Base
from app.models import *  # noqa

# Alembic Config object
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata

# Override the sqlalchemy.url from the config with our environment variable
config.set_main_option("sqlalchemy.url", settings.database_url_sync)


def get_url():
    # Use sync URL for Alembic migrations
    return settings.database_url_sync


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL scripts only)."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using sync engine."""
    from sqlalchemy import create_engine

    connectable = create_engine(get_url(), pool_pre_ping=True)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
