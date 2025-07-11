# Import all models here to ensure they are registered with SQLAlchemy
# This is important for Alembic migrations to work properly

from .base import *  # noqa
from .school import *  # noqa
from .user import *  # noqa
from .student import *  # noqa
from .academic import *  # noqa
from .fee import *  # noqa
from .grade import *  # noqa
from .communication import *  # noqa
