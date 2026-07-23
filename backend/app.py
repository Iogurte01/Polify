from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import Json
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import re
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from email_service import send_email
import requests
import os
import secrets
from werkzeug.security import generate_password_hash

app = Flask(__name__)
CORS(app)
load_dotenv()

application = app


def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)

    return psycopg2.connect(
        host=os.getenv("DB_HOST") or os.getenv("host") or "localhost",
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD") or os.getenv("DB_password")
    )


def _parse_jsonish_value(value):
    if value is None:
        return None

    if isinstance(value, (list, dict, int, float, bool)):
        return value

    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return ""

        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return value

    return value


def normalize_options_value(value):
    parsed = _parse_jsonish_value(value)

    if parsed is None or parsed == "":
        return []

    if isinstance(parsed, list):
        items = parsed
    elif isinstance(parsed, tuple):
        items = list(parsed)
    elif isinstance(parsed, str):
        items = [part.strip() for part in re.split(r"\s*,\s*", parsed) if part.strip()]
    else:
        items = [parsed]

    normalized_items = []
    for item in items:
        if item is None:
            continue
        text = str(item).strip()
        if text:
            normalized_items.append(text)

    return normalized_items


def normalize_question_response(question_type, raw_value):
    parsed = _parse_jsonish_value(raw_value)

    if question_type in ("text", "date"):
        if isinstance(parsed, str):
            text = parsed.strip()
            if not text:
                raise ValueError("resposta deve ser uma string não vazia")
            return text

        if isinstance(parsed, (int, float, bool)):
            return str(parsed)

        raise ValueError("resposta deve ser uma string")

    if question_type in ("rating", "number"):
        if isinstance(parsed, (int, float)):
            return parsed

        if isinstance(parsed, str):
            text = parsed.strip()
            if not text:
                raise ValueError("resposta deve ser um número ou string numérica")

            if re.fullmatch(r"-?\d+", text):
                return int(text)

            try:
                return float(text)
            except ValueError as exc:
                raise ValueError("resposta deve ser um número ou string numérica") from exc

        raise ValueError("resposta deve ser um número ou string numérica")

    if question_type == "multiple_choice":
        if isinstance(parsed, list):
            if len(parsed) != 1:
                raise ValueError("múltipla escolha aceita apenas uma resposta")
            parsed = parsed[0]

        if isinstance(parsed, (int, float, bool)):
            parsed = str(parsed)

        if not isinstance(parsed, str) or not parsed.strip():
            raise ValueError("múltipla escolha exige uma resposta em texto")

        return parsed.strip()

    if question_type == "checkbox":
        if isinstance(parsed, list):
            normalized_items = []
            for item in parsed:
                if item is None:
                    continue
                text = str(item).strip()
                if text:
                    normalized_items.append(text)
            if not normalized_items:
                raise ValueError("checkbox exige ao menos uma opção selecionada")
            return normalized_items

        if isinstance(parsed, str):
            text = parsed.strip()
            if text.startswith("["):
                try:
                    parsed_list = json.loads(text)
                except json.JSONDecodeError as exc:
                    raise ValueError("checkbox deve ser um array de respostas") from exc

                if not isinstance(parsed_list, list):
                    raise ValueError("checkbox deve ser um array de respostas")

                normalized_items = []
                for item in parsed_list:
                    if item is None:
                        continue
                    item_text = str(item).strip()
                    if item_text:
                        normalized_items.append(item_text)
                if not normalized_items:
                    raise ValueError("checkbox exige ao menos uma opção selecionada")
                return normalized_items

        raise ValueError("checkbox deve ser um array de respostas")

    raise ValueError(f"tipagem inválida: {question_type}")


def normalize_question_response_for_output(question_type, raw_value):
    try:
        return normalize_question_response(question_type, raw_value)
    except ValueError:
        if question_type == "checkbox":
            return normalize_options_value(raw_value)
        return raw_value


def normalize_email(email):
    return email.strip().lower()


def is_valid_full_name(name):
    return bool(re.fullmatch(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*", name))


def is_valid_phone_number(phone):
    return bool(re.fullmatch(r"\(\d{2}\) \d{5}-\d{4}", phone))

XP_PER_COMPLETED_SURVEY = 10

XP_LEVELS = [
    {"id": "iniciante", "name": "Iniciante", "min_xp": 0, "max_xp": 99, "color": "#6b7280", "icon": "compass"},
    {"id": "explorer", "name": "Explorador", "min_xp": 100, "max_xp": 199, "color": "#3b82f6", "icon": "handshake"},
    {"id": "collaborator", "name": "Colaborador", "min_xp": 200, "max_xp": 299, "color": "#8b5cf6", "icon": "award"},
    {"id": "specialist", "name": "Especialista", "min_xp": 300, "max_xp": 499, "color": "#6366f1", "icon": "shield-check"},
    {"id": "verified_analyst", "name": "Analista Verificado", "min_xp": 500, "max_xp": None, "color": "#f59e0b", "icon": "crown"},
]


def calculate_xp_level(xp_total):
    current_level = XP_LEVELS[0]
    next_level = None

    for index, level in enumerate(XP_LEVELS):
        max_xp = level["max_xp"]
        if max_xp is None or xp_total <= max_xp:
            current_level = level
            next_level = XP_LEVELS[index + 1] if index + 1 < len(XP_LEVELS) else None
            break

    if current_level["max_xp"] is None:
        faixa_atual = f"{current_level['min_xp']}+ XP"
        xp_para_proximo_nivel = 0
        progress_percent = 100
    else:
        faixa_atual = f"{current_level['min_xp']}-{current_level['max_xp']} XP"
        progress_percent = 0
        xp_para_proximo_nivel = 0
        
    if next_level:
        xp_para_proximo_nivel = max(next_level["min_xp"] - xp_total, 0)
        range_size = current_level["max_xp"] - current_level["min_xp"] + 1
        progress_percent = round(((xp_total - current_level["min_xp"]) / range_size) * 100)
        progress_percent = max(0, min(progress_percent, 100))

    return {
        "level_id": current_level["id"],
        "nivel_atual": current_level["name"],
        "faixa_atual": faixa_atual,
        "xp_proximo_nivel": next_level["min_xp"] if next_level else None,
        "xp_para_proximo_nivel": xp_para_proximo_nivel,
        "progress_percent": progress_percent,
        "level_color": current_level["color"],
        "level_icon": current_level["icon"],
    }


def ensure_user_progress(cur, user_id):
    cur.execute(
        """
        INSERT INTO user_progress (user_id, xp_total)
        VALUES (%s, 0)
        ON CONFLICT (user_id) DO NOTHING
        """,
        (user_id,)
    )


def get_user_progress_data(cur, user_id):
    ensure_user_progress(cur, user_id)
    cur.execute(
        "SELECT xp_total, created_at, updated_at FROM user_progress WHERE user_id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    xp_total, created_at, updated_at = row
    level_data = calculate_xp_level(xp_total or 0)
    return {
        "user_id": user_id,
        "xp_total": xp_total or 0,
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
        **level_data,
    }


@app.route("/api/register", methods=["POST"])
def register():
    data = request.json

    name = (data.get("name") or "").strip()
    email = normalize_email(data.get("email") or "")
    password = data.get("password") or ""
    phone = (data.get("phone") or "").strip()

    if not name or not email or not password or not phone:
        return jsonify({"success": False, "message": "Preencha todos os campos"}), 400

    if not is_valid_full_name(name):
        return jsonify({"success": False, "message": "Nome deve conter apenas letras"}), 400

    if not is_valid_phone_number(phone):
        return jsonify({"success": False, "message": "Telefone deve seguir o formato (12) 99677-1828"}), 400

    password_hash = generate_password_hash(password)

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(%s)",
            (email,)
        )

        existing_user = cur.fetchone()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email já cadastrado"
            }), 409

        cur.execute(
            "INSERT INTO users (nome, email, password_hash, telefone) VALUES (%s, %s, %s, %s)",
            (name, email, password_hash, phone)
        )

        conn.commit()
        
        return jsonify({"success": True, "message": "Usuário criado com sucesso"})
    
    except Exception as e:
        if conn:
            conn.rollback()

        if "users_email_key" in str(e):
            return jsonify({
                "success": False,
                "message": "Email já cadastrado"
            }), 409
        else:
            return jsonify({
                "success": False,
                "message": f"Erro ao criar usuário: {str(e)}"
            }), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    email = normalize_email(data.get("email") or "")
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "message": "Email e senha obrigatórios"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, nome, email, telefone, password_hash FROM users WHERE LOWER(email) = LOWER(%s)",
            (email,)
        )

        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            return jsonify({
                "success": False,
                "message": "Usuário não encontrado"
            }), 401
        
        user_id, name, user_email, phone, password_hash, = user

        if not check_password_hash(password_hash, password):
            return jsonify({
                "success": False,
                "message": "Senha inválida"
            }), 401
        
        return jsonify({
            "success": True,
            "message": "Login realizado com sucesso",
            "user": {
                "id": user_id,
                "name": name,
                "email": user_email,
                "telefone": phone
            }
        }), 200
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route("/api/login/google", methods=["POST"])
def login_google():
    data = request.get_json()

    code = data.get("code")

    if not code:
        return jsonify({"error": "Código não informado"}), 400

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code",
        },
    )

    print(token_response.status_code)
    print(token_response.text)

    if token_response.status_code != 200:
        return jsonify({
            "error": "Falha ao trocar código por token",
            "google": token_response.json()
        }), 400

    token_data = token_response.json()

    access_token = token_data["access_token"]

    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    if userinfo.status_code != 200:
        return jsonify({"error": "Não foi possível obter usuário"}), 400

    google_user = userinfo.json()

    print("=" * 60)
    print("DADOS DO GOOGLE:")
    print(google_user)
    print("=" * 60)

    conn = get_connection()
    cur = conn.cursor()
    # =====================================================
    # 1 - Procura pelo Google ID
    # =====================================================

    cur.execute("""
        SELECT id, nome, email, telefone
        FROM users
        WHERE google_id = %s
    """, (google_user["sub"],))

    user = cur.fetchone()


    # =====================================================
    # 2 - Se não encontrou pelo Google,
    # procura pelo e-mail
    # =====================================================

    if not user:

        cur.execute("""
            SELECT id, nome, email, telefone
            FROM users
            WHERE LOWER(email)=LOWER(%s)
        """, (google_user["email"],))

        user = cur.fetchone()


    # =====================================================
    # 3 - Encontrou pelo e-mail?
    # Vincula a conta Google
    # =====================================================

        if user:

            user_id, nome, email, telefone = user

            cur.execute("""
                UPDATE users
                SET
                    google_id=%s,
                    foto_perfil=%s,
                    email_verificado=%s,
                    auth_provider='google'
                WHERE id=%s
            """, (
                google_user["sub"],
                google_user.get("picture"),
                google_user.get("email_verified", False),
                user_id
            ))

            conn.commit()


    # =====================================================
    # 4 - Ainda não encontrou?
    # Cria usuário novo
    # =====================================================

        else:

            cur.execute("""
                INSERT INTO users (
                    nome,
                    sobrenome,
                    email,
                    password_hash,
                    google_id,
                    foto_perfil,
                    email_verificado,
                    auth_provider
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id, nome, email, telefone
            """, (
                google_user["given_name"],
                google_user.get("family_name"),
                google_user["email"],
                generate_password_hash(secrets.token_hex(32)),
                google_user["sub"],
                google_user.get("picture"),
                google_user.get("email_verified", False),
                "google"
            ))

            conn.commit()

            user = cur.fetchone()


    # =====================================================
    # 5 - Caso tenha feito UPDATE,
    # busca novamente o usuário
    # =====================================================

    if not user:

        cur.execute("""
            SELECT id, nome, email, telefone
            FROM users
            WHERE google_id=%s
        """, (google_user["sub"],))

        user = cur.fetchone()


    # =====================================================
    # 6 - Login
    # =====================================================

    user_id, nome, email, telefone = user

    cur.close()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Login realizado com sucesso",
        "user": {
            "id": user_id,
            "name": nome,
            "email": email,
            "telefone": telefone
        }
    }), 200

 
@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """
    Handle forgot password request
    Checks if email exists in database and returns appropriate response
    """
    data = request.json
    email = normalize_email(data.get("email") or "")

    if not email:
        return jsonify({"success": False, "message": "Email é obrigatório"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if email exists in database
        cur.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(%s)",
            (email,)
        )

        user = cur.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Não encontramos uma conta associada a este E-mail."
            }), 404

         # Email exists - generate verification code and send email
        verification_code = str(random.randint(100000, 999999))
        expires_at = datetime.now() + timedelta(minutes=15)
        
        # Store token in database
        cur.execute(
            """
            INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
            VALUES (%s, %s, %s, %s)
            """,
            (user[0], email, verification_code, expires_at)
        )
        
        html_body = f"""
        <h2>Código de Verificação</h2>
        <p>Seu código de verificação é: <strong>{verification_code}</strong></p>
        <p>Use este código para redefinir sua senha.</p>
        <p>Este código expira em 15 minutos.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        """
        
        email_sent = send_email(email, "Redefinição de Senha - Polify", html_body)
        
        if email_sent:
            conn.commit()
            return jsonify({
                "success": True,
                "message": "Código de verificação enviado para seu email."
            }), 200
        else:
            conn.rollback()
            return jsonify({
                "success": False,
                "message": "Erro ao enviar email de verificação."
            }), 500

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": "Erro ao processar solicitação"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/auth/verify-reset-code", methods=["POST"])
def verify_reset_code():
    data = request.json
    email = normalize_email(data.get("email") or "")
    code = data.get("code", "").strip()

    if not email or not code:
        return jsonify({"success": False, "message": "Email e código são obrigatórios"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Busca o token e suas informações
        cur.execute(
            """
            SELECT id, user_id, expires_at, used
            FROM password_reset_tokens
            WHERE email = %s AND token = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email, code)
        )

        token = cur.fetchone()

        if not token:
            return jsonify({"success": False, "message": "Código inválido ou incorreto."}), 400

        token_id, user_id, expires_at, used = token

        if used:
            return jsonify({"success": False, "message": "Este código já foi utilizado."}), 400

        if datetime.now() > expires_at.replace(tzinfo=None):
            return jsonify({"success": False, "message": "Este código expirou. Solicite um novo."}), 400

        # Se passou por tudo, o código é válido para abrir o Modal no front
        return jsonify({
            "success": True,
            "message": "Código válido.",
            "user_id": user_id
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": "Erro interno ao verificar o código"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    email = normalize_email(data.get("email") or "")
    code = data.get("code", "").strip()
    
    # Suporte para newPassword (padrão Front-end/JS) e new_password (padrão Python)
    new_password = data.get("newPassword") or data.get("new_password", "")

    if not email or not code or not new_password:
        return jsonify({"success": False, "message": "Email, código e nova senha são obrigatórios"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "A nova senha deve ter no mínimo 6 caracteres"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Revalida o código rigorosamente antes de permitir a alteração
        cur.execute(
            """
            SELECT id, user_id, expires_at, used
            FROM password_reset_tokens
            WHERE email = %s AND token = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email, code)
        )

        token = cur.fetchone()

        if not token:
            return jsonify({"success": False, "message": "Código inválido."}), 400

        token_id, user_id, expires_at, used = token

        if used:
            return jsonify({"success": False, "message": "Este código já foi utilizado."}), 400

        if datetime.now() > expires_at.replace(tzinfo=None):
            return jsonify({"success": False, "message": "O código expirou. Solicite um novo."}), 400

        # 1. Atualiza a senha com hash
        password_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (password_hash, user_id)
        )

        # 2. Invalida o token exato que acabou de ser usado
        cur.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = %s",
            (token_id,)
        )

        # 3. Trava de segurança extra: invalida outros tokens pendentes desse mesmo usuário
        cur.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE email = %s AND used = FALSE",
            (email,)
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Senha redefinida com sucesso!"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": "Erro interno ao redefinir a senha"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/auth/change-password", methods=["POST"])
def change_password():
    """
    Change password for authenticated user
    Validates current password before updating to new password
    Method: POST
    Request Body: {
        "user_id": 123,
        "current_password": "oldpassword",
        "new_password": "newpassword"
    }
    """
    data = request.json
    user_id = data.get("user_id")
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    print(f"DEBUG - change_password: user_id={user_id}, current_password_len={len(current_password)}, new_password_len={len(new_password)}")

    if not user_id or not current_password or not new_password:
        return jsonify({"success": False, "message": "ID do usuário, senha atual e nova senha são obrigatórios"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "A nova senha deve ter no mínimo 6 caracteres"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Get user's current password hash
        cur.execute(
            "SELECT id, password_hash FROM users WHERE id = %s",
            (user_id,)
        )

        user = cur.fetchone()

        if not user:
            print(f"DEBUG - User not found for user_id={user_id}")
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        db_user_id, password_hash = user
        print(f"DEBUG - Found user: db_user_id={db_user_id}, password_hash exists={bool(password_hash)}")

        # Verify current password
        password_valid = check_password_hash(password_hash, current_password)
        print(f"DEBUG - Password validation result: {password_valid}")
        
        if not password_valid:
            return jsonify({"success": False, "message": "Senha atual incorreta"}), 401

        # Update to new password hash
        new_password_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_password_hash, user_id)
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Senha alterada com sucesso!"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": "Erro interno ao alterar senha"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/users/<int:user_id>/progress", methods=["GET"])
def get_user_progress(user_id):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        progress_data = get_user_progress_data(cur, user_id)
        conn.commit()

        return jsonify({"success": True, "progress": progress_data}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar progresso: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


#cria um formulário
#key words: Criar - Postar - Publicar - Formulário 
@app.route("/api/forms", methods=["POST"])
def create_form():
    data = request.json

    nome_formulario = data.get("nome_formulario")
    descricao_formulario = data.get("descricao_formulario")
    categoria = data.get("categoria")
    min_respondentes = data.get("min_respondentes", 50)
    tempo_max_dias = data.get("tempo_max_dias", 30)
    pontos_base = data.get("pontos_base", 10)
    
    pontos_recompensa = data.get("pontos_recompensa", pontos_base)
    tempo_estimado = data.get("tempo_estimado")

    # [ADICIONADO] Capturando estado e cidade enviados pelo frontend
    estado = data.get("estado")
    cidade = data.get("city") or data.get("cidade")

    id_criador = data.get("id_criador")

    if not nome_formulario or not categoria or not id_criador:
        return jsonify({"success": False, "message": "Campos obrigatórios: nome_formulario, categoria, id_criador"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # [ATUALIZADO] Inserindo estado e cidade na tabela header_formulario
        cur.execute(
            """
            INSERT INTO header_formulario 
            (nome_formulario, descricao_formulario, categoria, min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, tempo_estimado, estado, cidade, id_criador)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (nome_formulario, descricao_formulario, categoria, min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, tempo_estimado, estado, cidade, id_criador)
        )

        result = cur.fetchone()
        form_id, created_at = result

        conn.commit()

        form_data = {
            "id": form_id,
            "nome_formulario": nome_formulario,
            "descricao_formulario": descricao_formulario,
            "categoria": categoria,
            "min_respondentes": min_respondentes,
            "tempo_max_dias": tempo_max_dias,
            "pontos_base": pontos_base,
            "pontos_recompensa": pontos_recompensa,
            "tempo_estimado": tempo_estimado,
            "state": estado,
            "city": cidade,
            "id_criador": id_criador,
            "created_at": created_at.isoformat() if created_at else None,
            "is_active": True
        }

        return jsonify({
            "success": True,
            "message": "Formulário criado com sucesso",
            "form": form_data
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao criar formulário: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/forms", methods=["GET"])
def get_forms():
    """
    Get all available forms/surveys for public listing
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # [ATUALIZADO] Get all active forms with question count, estado and cidade
        query = """
            SELECT
                hf.id,
                hf.nome_formulario,
                hf.descricao_formulario,
                hf.categoria,
                hf.min_respondentes,
                hf.pontos_base,
                hf.pontos_recompensa,
                hf.tempo_estimado,
                hf.estado,
                hf.cidade,
                hf.created_at,
                COUNT(pf.id_perg) as total_questions
            FROM header_formulario hf
            LEFT JOIN perguntas_form pf ON hf.id = pf.id_form
            WHERE hf.is_active = true
            GROUP BY hf.id, hf.nome_formulario, hf.descricao_formulario, hf.categoria, hf.min_respondentes, hf.pontos_base, hf.pontos_recompensa, hf.tempo_estimado, hf.estado, hf.cidade, hf.created_at
            ORDER BY hf.created_at DESC
        """

        cur.execute(query)
        forms = cur.fetchall()

        # Format results to match frontend expectations
        forms_list = []
        for form in forms:
            # [ATUALIZADO] Desempacotando as variáveis na ordem do SELECT
            (form_id, nome_formulario, descricao_formulario, categoria,
             min_respondentes, pontos_base, pontos_recompensa, tempo_estimado, estado, cidade, created_at, total_questions) = form

            # Count real responses for this form
            cur.execute("""
                SELECT COUNT(DISTINCT rf.id_user) as response_count
                FROM resp_form rf
                JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
                WHERE pf.id_form = %s
            """, (form_id,))
            
            response_count = cur.fetchone()[0] or 0

            forms_list.append({
                "id": form_id,
                "nome_formulario": nome_formulario,
                "descricao_formulario": descricao_formulario,
                "categoria": categoria,
                "min_respondentes": min_respondentes,
                "pontos_base": pontos_base,
                "pontos_recompensa": pontos_recompensa, # [NOVO]
                "tempo_estimado": tempo_estimado,       # [NOVO]
                "state": estado,   # [NOVO] Enviando para o front preencher o filtro de Estado
                "city": cidade,    # [NOVO] Enviando para o front preencher o filtro de Cidade
                "created_at": created_at.isoformat() if created_at else None,
                "total_questions": total_questions or 0,
                "responses": response_count,
                "criador_nome": "Anônimo"
            })

        return jsonify({
            "success": True,
            "forms": forms_list
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar formulários: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/questions", methods=["POST"])
def create_question():
    """
    Create a new question linked to a form
    Method: POST
    Request Body: {
        "id_form": 12,
        "num_pergunta": 1,
        "pergunta": "Question text",
        "alternativa": "Option1,Option2",
        "tipagem": "multiple_choice"
    }
    Saves in: perguntas_form table
    """
    data = request.json

    id_form = data.get("id_form")
    num_pergunta = data.get("num_pergunta")
    pergunta = data.get("pergunta")
    alternativa = data.get("alternativa", [])
    tipagem = data.get("tipagem")


    # Validar campos obrigatórios
    if not id_form or not num_pergunta or not pergunta or not tipagem:
        return jsonify({"success": False, "message": "Campos obrigatórios: id_form, num_pergunta, pergunta, tipagem"}), 400

    if tipagem not in ("text", "multiple_choice", "checkbox", "rating", "date", "number"):
        return jsonify({"success": False, "message": "tipagem inválida"}), 400

    normalized_alternativa = []
    if tipagem in ("multiple_choice", "checkbox"):
        normalized_alternativa = normalize_options_value(alternativa)
        if not normalized_alternativa:
            return jsonify({"success": False, "message": "alternativa deve conter ao menos uma opção"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verificar se o formulário existe
        cur.execute("SELECT id FROM header_formulario WHERE id = %s", (id_form,))
        form_exists = cur.fetchone()

        if not form_exists:
            return jsonify({"success": False, "message": "Formulário não encontrado"}), 404

        # Inserir a pergunta
        cur.execute(
            """
            INSERT INTO perguntas_form 
            (id_form, num_pergunta, pergunta, alternativa, tipagem)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id_perg, created_at
            """,
            (id_form, num_pergunta, pergunta, Json(normalized_alternativa), tipagem)
        )

        result = cur.fetchone()
        question_id, created_at = result

        conn.commit()

        # Retornar a pergunta criada
        question_data = {
            "id_perg": question_id,
            "id_form": id_form,
            "num_pergunta": num_pergunta,
            "pergunta": pergunta,
            "alternativa": normalized_alternativa,
            "tipagem": tipagem,
            "created_at": created_at.isoformat() if created_at else None
        }

        return jsonify({
            "success": True,
            "message": "Pergunta criada com sucesso",
            "question": question_data
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao criar pergunta: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/my-surveys", methods=["GET"])
def get_my_surveys():
    """
    Get surveys created by the authenticated user
    """
    user_id = request.args.get("user_id", type=int)
    status = request.args.get("status")
    category = request.args.get("category")
    
    if not user_id:
        return jsonify({"success": False, "message": "user_id parameter is required"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # [ATUALIZADO] Build query with filters
        query = """
            SELECT id, nome_formulario, descricao_formulario, categoria, 
                   min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, tempo_estimado, id_criador,
                   created_at, is_active
            FROM header_formulario 
            WHERE id_criador = %s
        """
        params = [user_id]

        if status:
            if status == "Ativa":
                query += " AND is_active = true"
            elif status == "Encerrada":
                query += " AND is_active = false"

        if category:
            query += " AND categoria = %s"
            params.append(category)

        query += " ORDER BY created_at DESC"

        cur.execute(query, tuple(params))
        surveys = cur.fetchall()

        # Format results
        surveys_list = []
        for survey in surveys:
            # [ATUALIZADO] Desempacotando as variáveis
            (survey_id, nome_formulario, descricao_formulario, categoria, 
             min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, tempo_estimado, id_criador,
             created_at, is_active) = survey

            # Count responses for this survey
            cur.execute("""
                SELECT COUNT(DISTINCT rf.id_user) as response_count
                FROM resp_form rf
                JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
                WHERE pf.id_form = %s
            """, (survey_id,))
            
            response_count = cur.fetchone()[0]

            surveys_list.append({
                "id": str(survey_id),
                "title": nome_formulario,
                "description": descricao_formulario,
                "category": categoria,
                "status": "Ativa" if is_active else "Encerrada",
                "responses": response_count,
                "targetResponses": min_respondentes,
                "pontos_base": pontos_base,
                "pontos_recompensa": pontos_recompensa, # [NOVO]
                "tempo_estimado": tempo_estimado,       # [NOVO]
                "createdAt": created_at.isoformat() if created_at else None,
                "source": "created"
            })

        return jsonify({
            "success": True,
            "surveys": surveys_list,
            "total": len(surveys_list)
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar pesquisas: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route("/api/forms/<int:form_id>", methods=["GET"])
def get_form_details(form_id):
    """
    Get details of a specific form
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # [ATUALIZADO] Adicionado estado e cidade no SELECT
        cur.execute(
            """
            SELECT id, nome_formulario, descricao_formulario, categoria, 
                   min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, 
                   tempo_estimado, estado, cidade, id_criador,
                   created_at, is_active
            FROM header_formulario 
            WHERE id = %s
            """,
            (form_id,)
        )

        form = cur.fetchone()

        if not form:
            return jsonify({"success": False, "message": "Formulário não encontrado"}), 404

        # [ATUALIZADO] Desempacotando as novas variáveis na ordem correta do SELECT
        (form_id_db, nome_formulario, descricao_formulario, categoria, 
         min_respondentes, tempo_max_dias, pontos_base, pontos_recompensa, 
         tempo_estimado, estado, cidade, id_criador,
         created_at, is_active) = form

        # Count total responses for this form
        cur.execute("""
            SELECT COUNT(DISTINCT rf.id_user) as response_count
            FROM resp_form rf
            JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
            WHERE pf.id_form = %s
        """, (form_id,))
        
        total_responses = cur.fetchone()[0] or 0

        # Get questions for this form
        cur.execute(
            """
            SELECT id_perg, num_pergunta, pergunta, alternativa, tipagem
            FROM perguntas_form 
            WHERE id_form = %s
            ORDER BY num_pergunta
            """,
            (form_id,)
        )

        questions = cur.fetchall()
        questions_list = []
        for question in questions:
            (id_perg, num_pergunta, pergunta, alternativa, tipagem) = question
            questions_list.append({
                "id_perg": id_perg,
                "num_pergunta": num_pergunta,
                "pergunta": pergunta,
                "alternativa": normalize_options_value(alternativa),
                "tipagem": tipagem
            })

        form_data = {
            "id": form_id_db,
            "nome_formulario": nome_formulario,
            "descricao_formulario": descricao_formulario,
            "categoria": categoria,
            "min_respondentes": min_respondentes,
            "tempo_max_dias": tempo_max_dias,
            "pontos_base": pontos_base,
            "pontos_recompensa": pontos_recompensa,
            "tempo_estimado": tempo_estimado,
            "state": estado,   # [NOVO] Enviando para o front preencher o filtro de Estado
            "city": cidade,    # [NOVO] Enviando para o front preencher o filtro de Cidade
            "id_criador": id_criador,
            "created_at": created_at.isoformat() if created_at else None,
            "is_active": is_active,
            "total_responses": total_responses,
            "total_questions": len(questions_list),
            "questions": questions_list
        }

        return jsonify({
            "success": True,
            "form": form_data
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar formulário: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/forms/<int:form_id>", methods=["DELETE"])
def delete_form(form_id):
    """
    Delete a survey/form
    Method: DELETE
    URL Param: form_id (required)
    Returns: Success message
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if form exists
        cur.execute("SELECT id FROM header_formulario WHERE id = %s", (form_id,))
        form_exists = cur.fetchone()

        if not form_exists:
            return jsonify({"success": False, "message": "Formulário não encontrado"}), 404

        # Delete the form (cascading deletes will handle questions and responses)
        cur.execute("DELETE FROM header_formulario WHERE id = %s", (form_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Formulário deletado com sucesso"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao deletar formulário: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/surveys/<int:survey_id>/responses", methods=["GET"])
def get_survey_responses(survey_id):
    """
    Get responses for a specific survey
    Method: GET
    Returns: List of responses for the survey
    """
    user_id = request.args.get("user_id", type=int)
    
    if not user_id:
        return jsonify({"success": False, "message": "user_id parameter is required"}), 400
    
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # First, check if the survey exists and if the user is the owner
        cur.execute(
            """
            SELECT hf.id, hf.nome_formulario, hf.id_criador
            FROM header_formulario hf
            WHERE hf.id = %s
            """,
            (survey_id,)
        )

        survey = cur.fetchone()

        if not survey:
            return jsonify({"success": False, "message": "Pesquisa não encontrada"}), 404

        (survey_db_id, survey_name, survey_owner_id) = survey

        # SECURITY CHECK: Only allow survey owner to see responses
        if survey_owner_id != user_id:
            return jsonify({"success": False, "message": "Você não tem permissão para visualizar as respostas desta pesquisa"}), 403

        print(f"DEBUG: User {user_id} accessing responses for survey {survey_id} (owner: {survey_owner_id})")

        # Get all responses for this survey
        query = """
        SELECT 
            rf.id,
            rf.id_user,
            rf.resposta,
            rf.created_at,
            pf.id_perg,
            pf.pergunta,
            pf.num_pergunta,
            pf.tipagem,
            pf.alternativa,
            u.nome || ' ' || COALESCE(u.sobrenome, '') as respondent_name
        FROM resp_form rf
        JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
        JOIN users u ON rf.id_user = u.id
        WHERE pf.id_form = %s
        ORDER BY rf.id_user, pf.num_pergunta
        """

        cur.execute(query, (survey_id,))
        response_rows = cur.fetchall()

        # Group responses by user
        responses_by_user = {}
        for row in response_rows:
            (resp_id, user_id_resp, resposta, created_at, perg_id, pergunta, num_pergunta, tipagem, alternativa, respondent_name) = row
            
            if user_id_resp not in responses_by_user:
                responses_by_user[user_id_resp] = {
                    "id": resp_id,
                    "user_id": user_id_resp,
                    "respondent_name": respondent_name,
                    "created_at": created_at.isoformat() if created_at else None,
                    "questions": []
                }
            
            responses_by_user[user_id_resp]["questions"].append({
                "id_perg": perg_id,
                "pergunta": pergunta,
                "num_pergunta": num_pergunta,
                "tipagem": tipagem,
                "alternativa": normalize_options_value(alternativa),
                "resposta": normalize_question_response_for_output(tipagem, resposta)
            })

        # Convert to array and sort by creation date
        responses_list = list(responses_by_user.values())
        responses_list.sort(key=lambda x: x["created_at"] or "")

        return jsonify({
            "success": True,
            "survey": {
                "id": survey_db_id,
                "nome_formulario": survey_name,
                "id_criador": survey_owner_id
            },
            "responses": responses_list,
            "total": len(responses_list)
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar respostas: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/responses", methods=["POST"])
def save_responses():
    """
    Save user responses to a survey
    Method: POST
    Request Body: {
        "id_user": 3,
        "survey_id": 12,
        "responses": [
            {"id_perg": 15, "resposta": "Sim"},
            {"id_perg": 16, "resposta": "Avançado"}
        ]
    }
    Saves in: resp_form table
    """
    data = request.json

    id_user = data.get("id_user")
    survey_id = data.get("survey_id")
    responses = data.get("responses", [])

    try:
        id_user = int(id_user)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "id_user inválido"}), 400

    if survey_id is not None:
        try:
            survey_id = int(survey_id)
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "survey_id inválido"}), 400

    # Validar campos obrigatórios
    if not id_user or not responses:
        return jsonify({"success": False, "message": "Campos obrigatórios: id_user, responses"}), 400

    if not isinstance(responses, list) or len(responses) == 0:
        return jsonify({"success": False, "message": "responses deve ser uma lista não vazia"}), 400

    response_question_ids = []
    for response in responses:
        id_perg = response.get("id_perg")
        if id_perg is None:
            return jsonify({"success": False, "message": "Cada resposta deve ter id_perg e resposta"}), 400
        try:
            id_perg = int(id_perg)
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "id_perg inválido"}), 400
        response_question_ids.append(id_perg)

    if len(response_question_ids) != len(set(response_question_ids)):
        return jsonify({"success": False, "message": "Cada pergunta deve aparecer apenas uma vez no payload"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Validar usuário existe
        cur.execute("SELECT id FROM users WHERE id = %s", (id_user,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        # Resolver survey_id quando o frontend não enviar explicitamente
        if not survey_id:
            cur.execute(
                "SELECT id_form FROM perguntas_form WHERE id_perg = %s",
                (response_question_ids[0],)
            )
            survey_row = cur.fetchone()
            if not survey_row:
                return jsonify({"success": False, "message": "Não foi possível identificar o formulário da resposta"}), 400
            survey_id = survey_row[0]

        # Validar formulário existe
        cur.execute("SELECT id FROM header_formulario WHERE id = %s", (survey_id,))
        survey_exists = cur.fetchone()
        if not survey_exists:
            return jsonify({"success": False, "message": "Formulário não encontrado"}), 404

        # Carregar perguntas do formulário e validar contra o payload
        cur.execute(
            """
            SELECT id_perg, tipagem, alternativa
            FROM perguntas_form
            WHERE id_form = %s
            ORDER BY num_pergunta
            """,
            (survey_id,)
        )
        survey_questions = cur.fetchall()
        question_map = {
            question_id: {
                "tipagem": tipagem,
                "alternativa": normalize_options_value(alternativa),
            }
            for question_id, tipagem, alternativa in survey_questions
        }

        if len(response_question_ids) != len(question_map):
            return jsonify({
                "success": False,
                "message": "Responda todas as perguntas para concluir a pesquisa"
            }), 400

        # Validar que todas as perguntas pertencem ao mesmo formulário
        for id_perg in response_question_ids:
            if id_perg not in question_map:
                return jsonify({"success": False, "message": f"Pergunta {id_perg} não pertence ao formulário informado"}), 400

        # Cria a linha de participação caso ainda não exista e bloqueia para evitar duplicidade
        cur.execute(
            """
            INSERT INTO header_form_cont (id_form, id_user, completed)
            VALUES (%s, %s, FALSE)
            ON CONFLICT (id_form, id_user) DO NOTHING
            """,
            (survey_id, id_user)
        )

        cur.execute(
            """
            SELECT completed
            FROM header_form_cont
            WHERE id_form = %s AND id_user = %s
            FOR UPDATE
            """,
            (survey_id, id_user)
        )
        participation_row = cur.fetchone()
        already_completed = participation_row[0] if participation_row else False

        if already_completed:
            conn.rollback()
            return jsonify({"success": False, "message": "Você já respondeu esta pesquisa"}), 409

        # Validar e inserir cada resposta
        saved_responses = []
        for response in responses:
            id_perg = response.get("id_perg")
            resposta_raw = response.get("resposta")

            if id_perg is None:
                return jsonify({"success": False, "message": f"Cada resposta deve ter id_perg e resposta"}), 400

            question_meta = question_map.get(id_perg)
            if not question_meta:
                return jsonify({"success": False, "message": f"Pergunta {id_perg} não encontrada"}), 404

            try:
                resposta_value = normalize_question_response(question_meta["tipagem"], resposta_raw)
            except ValueError as validation_error:
                return jsonify({"success": False, "message": str(validation_error)}), 400

            # Inserir ou atualizar resposta (UPSERT)
            cur.execute(
                """
                INSERT INTO resp_form (id_perg, id_user, resposta)
                VALUES (%s, %s, %s)
                ON CONFLICT (id_perg, id_user) 
                DO UPDATE SET resposta = EXCLUDED.resposta, updated_at = CURRENT_TIMESTAMP
                RETURNING id, created_at
                """,
                (id_perg, id_user, Json(resposta_value))
            )

            result = cur.fetchone()
            response_id, created_at = result
            saved_responses.append({
                "id": response_id,
                "id_perg": id_perg,
                "created_at": created_at.isoformat() if created_at else None
            })

        # Marca a participação como concluída e soma XP no mesmo commit
        cur.execute(
            """
            UPDATE header_form_cont
            SET completed = TRUE, completion_date = CURRENT_TIMESTAMP
            WHERE id_form = %s AND id_user = %s
            """,
            (survey_id, id_user)
        )

        cur.execute(
            """
            INSERT INTO user_progress (user_id, xp_total)
            VALUES (%s, %s)
            ON CONFLICT (user_id)
            DO UPDATE SET xp_total = user_progress.xp_total + EXCLUDED.xp_total,
                          updated_at = CURRENT_TIMESTAMP
            RETURNING xp_total
            """,
            (id_user, XP_PER_COMPLETED_SURVEY)
        )
        xp_total = cur.fetchone()[0]
        xp_level = calculate_xp_level(xp_total)

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Respostas salvas com sucesso",
            "responses": saved_responses,
            "xp_earned": XP_PER_COMPLETED_SURVEY,
            "xp_total": xp_total,
            "nivel_atual": xp_level["nivel_atual"],
            "level_id": xp_level["level_id"],
            "faixa_atual": xp_level["faixa_atual"],
            "xp_proximo_nivel": xp_level["xp_proximo_nivel"],
            "xp_para_proximo_nivel": xp_level["xp_para_proximo_nivel"],
            "progress_percent": xp_level["progress_percent"],
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao salvar respostas: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/wallet/credit", methods=["POST"])
def credit_wallet_tokens():
    data = request.json or {}

    user_id = data.get("user_id")
    amount = data.get("amount")
    reason = data.get("reason")
    purchase_status = data.get("purchase_status", "completed")

    if not user_id or amount is None or not reason:
        return jsonify({
            "success": False,
            "message": "Campos obrigatórios: user_id, amount, reason"
        }), 400

    try:
        user_id = int(user_id)
        amount = int(amount)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "user_id e amount devem ser inteiros"}), 400

    if amount <= 0:
        return jsonify({"success": False, "message": "amount deve ser maior que zero"}), 400

    if purchase_status not in {"pending", "completed", "failed", "canceled", "refunded"}:
        return jsonify({"success": False, "message": "purchase_status inválido"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        cur.execute(
            """
            SELECT current_balance
            FROM token_balance
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (user_id,)
        )
        last_balance_row = cur.fetchone()
        previous_balance = int(last_balance_row[0]) if last_balance_row and last_balance_row[0] is not None else 0
        new_balance = previous_balance + amount

        cur.execute(
            """
            INSERT INTO token_balance
            (user_id, transaction_type, amount, current_balance, reason, purchase_status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (user_id, "credit", amount, new_balance, reason, purchase_status)
        )

        transaction_id, created_at = cur.fetchone()
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Tokens creditados com sucesso",
            "balance": new_balance,
            "transaction": {
                "id": transaction_id,
                "user_id": user_id,
                "transaction_type": "credit",
                "amount": amount,
                "current_balance": new_balance,
                "reason": reason,
                "purchase_status": purchase_status,
                "created_at": created_at.isoformat() if created_at else None
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao creditar tokens: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/wallet/debit", methods=["POST"])
def debit_wallet_tokens():
    data = request.json or {}

    user_id = data.get("user_id")
    amount = data.get("amount")
    reason = data.get("reason")
    purchase_status = data.get("purchase_status", "completed")

    if not user_id or amount is None or not reason:
        return jsonify({
            "success": False,
            "message": "Campos obrigatórios: user_id, amount, reason"
        }), 400

    try:
        user_id = int(user_id)
        amount = int(amount)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "user_id e amount devem ser inteiros"}), 400

    if amount <= 0:
        return jsonify({"success": False, "message": "amount deve ser maior que zero"}), 400

    if purchase_status not in {"pending", "completed", "failed", "canceled", "refunded"}:
        return jsonify({"success": False, "message": "purchase_status inválido"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        cur.execute(
            """
            SELECT current_balance
            FROM token_balance
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (user_id,)
        )
        last_balance_row = cur.fetchone()
        previous_balance = int(last_balance_row[0]) if last_balance_row and last_balance_row[0] is not None else 0

        if previous_balance < amount:
            return jsonify({
                "success": False,
                "message": "Saldo insuficiente"
            }), 409

        new_balance = previous_balance - amount

        cur.execute(
            """
            INSERT INTO token_balance
            (user_id, transaction_type, amount, current_balance, reason, purchase_status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (user_id, "debit", amount, new_balance, reason, purchase_status)
        )

        transaction_id, created_at = cur.fetchone()
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Tokens debitados com sucesso",
            "balance": new_balance,
            "transaction": {
                "id": transaction_id,
                "user_id": user_id,
                "transaction_type": "debit",
                "amount": amount,
                "current_balance": new_balance,
                "reason": reason,
                "purchase_status": purchase_status,
                "created_at": created_at.isoformat() if created_at else None
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao debitar tokens: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/wallet/<int:user_id>", methods=["GET"])
def get_wallet_data(user_id):
    """
    Get wallet data for a specific user: current balance and transaction history
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verify user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        # Get current balance (most recent transaction)
        cur.execute(
            """
            SELECT current_balance
            FROM token_balance
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (user_id,)
        )
        balance_row = cur.fetchone()
        current_balance = int(balance_row[0]) if balance_row and balance_row[0] is not None else 0

        # Get transaction history (last 50 transactions)
        cur.execute(
            """
            SELECT id, transaction_type, amount, current_balance, reason, purchase_status, created_at
            FROM token_balance
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 50
            """,
            (user_id,)
        )
        transactions = []
        for row in cur.fetchall():
            transactions.append({
                "id": row[0],
                "type": "earned" if row[1] == "credit" else "spent",
                "amount": row[2],
                "current_balance": row[3],
                "description": row[4],
                "purchase_status": row[5],
                "date": row[6].isoformat() if row[6] else None
            })

        return jsonify({
            "success": True,
            "balance": current_balance,
            "history": transactions
        }), 200

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao buscar dados da carteira: {str(e)}"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/purchase-intentions", methods=["POST"])
def register_purchase_intention():
    data = request.json

    user_id = data.get("user_id")
    selected_plan = data.get("selected_plan")
    reason = data.get("reason")
    tokens_amount = data.get("tokens_amount")
    price = data.get("price")

    # Validar campos obrigatórios
    if not user_id or not selected_plan or not reason or not tokens_amount or not price:
        return jsonify({
            "success": False,
            "message": "Campos obrigatórios: user_id, selected_plan, reason, tokens_amount, price"
        }), 400

    if not isinstance(tokens_amount, int) or tokens_amount <= 0:
        return jsonify({
            "success": False,
            "message": "tokens_amount deve ser um número inteiro positivo"
        }), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Verificar se usuário existe
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user_exists = cur.fetchone()
        if not user_exists:
            return jsonify({"success": False, "message": "Usuário não encontrado"}), 404

        # Registrar intenção de compra
        cur.execute(
            """
            INSERT INTO purchase_intentions 
            (user_id, selected_plan, reason, tokens_amount, price)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (user_id, selected_plan, reason, tokens_amount, price)
        )

        result = cur.fetchone()
        purchase_id, created_at = result

        # Nota: Aqui não estamos atualizando a tabela users diretamente
        # pois não temos uma coluna de saldo de tokens no backend.
        # O frontend gerencia o saldo localmente. 
        # Se no futuro precisar persistir, adicionar coluna token_balance em users.

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Intenção de compra registrada com sucesso",
            "purchase": {
                "id": purchase_id,
                "user_id": user_id,
                "selected_plan": selected_plan,
                "tokens_amount": tokens_amount,
                "price": price,
                "created_at": created_at.isoformat() if created_at else None
            }
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Erro ao registrar intenção de compra: {str(e)}"
        }), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)