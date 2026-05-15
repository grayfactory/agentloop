from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from models.schemas import FsListResponse, FsWriteRequest
from services.fs_service import list_directory, pick_folder, resolve_file, write_file

router = APIRouter(prefix="/api/fs", tags=["fs"])


@router.get("/list", response_model=FsListResponse)
def list_path(path: str = Query(default="")):
    try:
        return list_directory(path or None)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except NotADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/file")
def get_file(path: str = Query(...)):
    try:
        file_path = resolve_file(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IsADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return FileResponse(file_path, headers={"Cache-Control": "no-cache"})


@router.put("/file")
def put_file(req: FsWriteRequest, path: str = Query(...)):
    try:
        write_file(path, req.content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IsADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"status": "ok"}


@router.post("/pick_folder")
def pick_folder_endpoint():
    try:
        folder = pick_folder()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"폴더 선택 실패: {e}")
    return {"path": folder}
