from fastapi import APIRouter, HTTPException
from models.schemas import Project, ProjectDetail, InitProjectRequest
from services.project_service import list_projects, get_project, init_project, delete_project

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[Project])
def get_projects():
    return list_projects()


@router.get("/{name}", response_model=ProjectDetail)
def get_project_detail(name: str):
    try:
        return get_project(name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=dict)
def create_project(req: InitProjectRequest):
    try:
        folder = init_project(req.num, req.title)
        return {"folder_name": folder, "message": "프로젝트가 생성되었습니다."}
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{name}", response_model=dict)
def remove_project(name: str):
    try:
        delete_project(name)
        return {"message": "프로젝트가 삭제되었습니다."}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
