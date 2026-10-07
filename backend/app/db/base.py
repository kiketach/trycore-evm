from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base for ORM models.

    Tables are created by db/init/01_schema.sql, not by the ORM.
    """
