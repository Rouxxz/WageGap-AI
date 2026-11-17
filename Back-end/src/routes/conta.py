# ROTAS DA CONTA (preferências, senha, exportação, exclusão)
from fastapi import APIRouter, HTTPException, Response

from src.config import conexao
from src.exportacao import gerar_csv_export
from src.repositories import dashboard, preferencias, usuarios
from src.schemas import DeleteAccountSchema, PasswordChangeSchema, PreferencesSchema
from src.security import hash_senha, verificar_senha

router = APIRouter(prefix="/users", tags=["Conta"])


def _usuario_ou_404(cursor, user_id):
    user = usuarios.buscar_por_id(cursor, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


@router.get("/{user_id}/preferences")
def get_preferences(user_id: int):
    with conexao() as cursor:
        _usuario_ou_404(cursor, user_id)
        return preferencias.buscar(cursor, user_id)


@router.put("/{user_id}/preferences")
def update_preferences(user_id: int, data: PreferencesSchema):
    with conexao() as cursor:
        _usuario_ou_404(cursor, user_id)
        prefs = preferencias.buscar(cursor, user_id)
        prefs.update({k: v for k, v in data.dict().items() if v is not None})
        preferencias.salvar(cursor, user_id, prefs)
    return prefs


@router.put("/{user_id}/password")
def change_password(user_id: int, data: PasswordChangeSchema):
    if len(data.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter ao menos 6 caracteres.")

    with conexao() as cursor:
        user = _usuario_ou_404(cursor, user_id)
        if not verificar_senha(data.senha_atual, user["senha"]):
            raise HTTPException(status_code=401, detail="Senha atual incorreta.")
        usuarios.atualizar_senha(cursor, user_id, hash_senha(data.nova_senha))

    return {"message": "Senha alterada com sucesso!"}


@router.get("/{user_id}/export")
def export_user_data(user_id: int):
    with conexao() as cursor:
        user = _usuario_ou_404(cursor, user_id)
        prefs = preferencias.buscar(cursor, user_id)
        ranking = dashboard.listar_ranking_export(cursor)
        clusters = dashboard.listar_clusters(cursor)

    return Response(
        content=gerar_csv_export(user, prefs, ranking, clusters),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="wagegap-dados.csv"'}
    )


@router.delete("/{user_id}")
def delete_account(user_id: int, data: DeleteAccountSchema):
    with conexao() as cursor:
        user = _usuario_ou_404(cursor, user_id)
        if not verificar_senha(data.senha, user["senha"]):
            raise HTTPException(status_code=401, detail="Senha incorreta.")
        usuarios.excluir(cursor, user_id)

    return {"message": "Conta excluída com sucesso."}
