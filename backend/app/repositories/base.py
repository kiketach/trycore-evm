from sqlalchemy.orm import Session

from app.db.base import Base


class Repository[ModelT: Base]:
    """Persistence shared by every repository: flush and refresh so the caller
    sees database-generated values (ids, timestamps) before the service commits."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, entity: ModelT) -> ModelT:
        self._session.add(entity)
        return self.save(entity)

    def save(self, entity: ModelT) -> ModelT:
        self._session.flush()
        self._session.refresh(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        self._session.delete(entity)
        self._session.flush()
