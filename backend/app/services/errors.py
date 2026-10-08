class ResourceNotFoundError(Exception):
    """A requested resource does not exist. The API layer maps it to HTTP 404."""

    def __init__(self, resource: str, resource_id: int) -> None:
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} {resource_id} not found")
