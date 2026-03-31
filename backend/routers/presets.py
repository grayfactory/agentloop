from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.preset_service import (
    list_presets,
    get_preset,
    create_preset,
    update_preset,
    delete_preset,
)

router = APIRouter(prefix="/api/presets", tags=["presets"])


class PresetRequest(BaseModel):
    id: str
    name: str
    description: str
    content: str


@router.get("")
def get_presets():
    return list_presets()


@router.get("/{preset_id}")
def get_preset_detail(preset_id: str):
    try:
        return get_preset(preset_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("")
def create_new_preset(req: PresetRequest):
    try:
        return create_preset(req.id, req.name, req.description, req.content)
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{preset_id}")
def update_existing_preset(preset_id: str, req: PresetRequest):
    try:
        return update_preset(preset_id, req.name, req.description, req.content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{preset_id}")
def remove_preset(preset_id: str):
    try:
        delete_preset(preset_id)
        return {"message": "프리셋이 삭제되었습니다."}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
