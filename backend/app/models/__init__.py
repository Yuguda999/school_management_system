# Import all models here to ensure they are registered with SQLAlchemy
# This is important for Alembic migrations to work properly

from .base import *  # noqa
from .school import *  # noqa
from .school_ownership import *  # noqa
from .user import *  # noqa
from .student import *  # noqa
from .academic import *  # noqa
from .fee import *  # noqa
from .grade import *  # noqa
from .communication import *  # noqa
from .teacher_invitation import *  # noqa
from .document import *  # noqa
from .report_card_template import *  # noqa
from .teacher_material import *  # noqa
