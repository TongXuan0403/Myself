from fastapi import APIRouter, Depends, HTTPException, Query

from ..models import (
    Collection,
    CollectionCreate,
    CollectionUpdate,
    Note,
    NoteCreate,
    NoteUpdate,
    Project,
    ProjectCreate,
    ProjectUpdate,
)
from ..store import (
    create_collection,
    create_note,
    create_project,
    delete_collection,
    delete_note,
    delete_project,
    fetch_collection,
    fetch_note,
    fetch_project,
    list_collections,
    list_notes,
    list_projects,
    update_collection,
    update_note,
    update_project,
)
from ..auth import require_auth

collections_router = APIRouter(prefix="/api/collections", tags=["collections"], dependencies=[Depends(require_auth)])
projects_router = APIRouter(prefix="/api/projects", tags=["projects"], dependencies=[Depends(require_auth)])
notes_router = APIRouter(prefix="/api/notes", tags=["notes"], dependencies=[Depends(require_auth)])


@collections_router.get("", response_model=list[Collection])
def get_collections() -> list[Collection]:
    return list_collections()


@collections_router.get("/{collection_id}", response_model=Collection)
def get_collection(collection_id: int) -> Collection:
    try:
        return fetch_collection(collection_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Collection not found") from error


@collections_router.post("", response_model=Collection, status_code=201)
def post_collection(payload: CollectionCreate) -> Collection:
    try:
        return create_collection(payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@collections_router.put("/{collection_id}", response_model=Collection)
def put_collection(collection_id: int, payload: CollectionUpdate) -> Collection:
    try:
        return update_collection(collection_id, payload)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Collection not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@collections_router.delete("/{collection_id}", status_code=204)
def remove_collection(collection_id: int) -> None:
    try:
        delete_collection(collection_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Collection not found") from error


@projects_router.get("", response_model=list[Project])
def get_projects() -> list[Project]:
    return list_projects()


@projects_router.get("/{project_id}", response_model=Project)
def get_project(project_id: int) -> Project:
    try:
        return fetch_project(project_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Project not found") from error


@projects_router.post("", response_model=Project, status_code=201)
def post_project(payload: ProjectCreate) -> Project:
    try:
        return create_project(payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@projects_router.put("/{project_id}", response_model=Project)
def put_project(project_id: int, payload: ProjectUpdate) -> Project:
    try:
        return update_project(project_id, payload)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Project not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@projects_router.delete("/{project_id}", status_code=204)
def remove_project(project_id: int) -> None:
    try:
        delete_project(project_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Project not found") from error


@notes_router.get("", response_model=list[Note])
def get_notes(note_type: str | None = Query(default=None, alias="type")) -> list[Note]:
    return list_notes(note_type=note_type)


@notes_router.get("/{note_id}", response_model=Note)
def get_note(note_id: int) -> Note:
    try:
        return fetch_note(note_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Note not found") from error


@notes_router.post("", response_model=Note, status_code=201)
def post_note(payload: NoteCreate) -> Note:
    return create_note(payload)


@notes_router.put("/{note_id}", response_model=Note)
def put_note(note_id: int, payload: NoteUpdate) -> Note:
    try:
        return update_note(note_id, payload)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Note not found") from error


@notes_router.delete("/{note_id}", status_code=204)
def remove_note(note_id: int) -> None:
    try:
        delete_note(note_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Note not found") from error
