from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from models.schemas import (
    CreateDocumentRequest,
    Document,
    FeedbackRequest,
    RenameDocumentRequest,
    UpdateDocumentRequest,
    UploadError,
    UploadResult,
    WorkLog,
)
from services.document_service import (
    create_document,
    delete_document,
    get_document_content,
    get_worklogs,
    insert_feedback,
    list_documents,
    rename_document,
    update_document_content,
    upload_file,
)

router = APIRouter(prefix="/api/projects/{name}", tags=["documents"])


@router.get("/documents", response_model=list[Document])
def get_documents(name: str):
    return list_documents(name)


@router.get("/documents/{filename}", response_class=PlainTextResponse)
def get_document(name: str, filename: str):
    try:
        return get_document_content(name, filename)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/documents/{filename}/feedback")
def post_feedback(name: str, filename: str, req: FeedbackRequest):
    try:
        insert_feedback(name, filename, req)
        return {"status": "ok"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/documents")
def create_document_endpoint(name: str, req: CreateDocumentRequest):
    try:
        created = create_document(name, req.filename, req.content)
        return {"filename": created, "status": "created"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload", response_model=UploadResult)
async def upload_files_endpoint(name: str, files: list[UploadFile]):
    uploaded: list[str] = []
    errors: list[UploadError] = []

    for file in files:
        filename = file.filename or "unnamed"
        try:
            content = await file.read()
            upload_file(name, filename, content)
            uploaded.append(filename)
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except (FileExistsError, ValueError) as e:
            errors.append(UploadError(filename=filename, detail=str(e)))

    return UploadResult(uploaded=uploaded, errors=errors)


@router.patch("/documents/{filename}")
def rename_document_endpoint(name: str, filename: str, req: RenameDocumentRequest):
    try:
        new_name = rename_document(name, filename, req.new_filename)
        return {"old_filename": filename, "new_filename": new_name, "status": "renamed"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/documents/{filename}")
def delete_document_endpoint(name: str, filename: str):
    try:
        delete_document(name, filename)
        return {"status": "deleted"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/documents/{filename}")
def update_document(name: str, filename: str, req: UpdateDocumentRequest):
    try:
        update_document_content(name, filename, req.content)
        return {"status": "ok"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/worklog", response_model=list[WorkLog])
def get_worklog(name: str):
    return get_worklogs(name)
