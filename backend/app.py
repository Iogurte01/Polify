from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
CORS(app)


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", 5432),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

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

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Preencha todos os campos"}), 400

    password_hash = generate_password_hash(password)

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO users (nome, email, password_hash) VALUES (%s, %s, %s)",
            (name, email, password_hash)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Usuário criado com sucesso"})
    
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()

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

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email e senha obrigatórios"}), 400


    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, nome, email, password_hash FROM users WHERE email = %s",
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
        
        user_id, name, user_email, password_hash, = user

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
                "email": user_email

            }
        }), 200
    
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


@app.route("/api/forms", methods=["POST"])
def create_form():
    """
    Create a new survey/form
    Method: POST
    Request Body: {
        "nome_formulario": "Survey Name",
        "descricao_formulario": "Description",
        "categoria": "tecnologia",
        "min_respondentes": 50,
        "tempo_max_dias": 30,
        "pontos_base": 10,
        "id_criador": 3
    }
    Saves in: header_formulario table
    """
    data = request.json

    nome_formulario = data.get("nome_formulario")
    descricao_formulario = data.get("descricao_formulario")
    categoria = data.get("categoria")
    min_respondentes = data.get("min_respondentes", 50)
    tempo_max_dias = data.get("tempo_max_dias", 30)
    pontos_base = data.get("pontos_base", 10)
    id_criador = data.get("id_criador")

    # Validar campos obrigatórios
    if not nome_formulario or not categoria or not id_criador:
        return jsonify({"success": False, "message": "Campos obrigatórios: nome_formulario, categoria, id_criador"}), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Inserir o formulário
        cur.execute(
            """
            INSERT INTO header_formulario 
            (nome_formulario, descricao_formulario, categoria, min_respondentes, tempo_max_dias, pontos_base, id_criador)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (nome_formulario, descricao_formulario, categoria, min_respondentes, tempo_max_dias, pontos_base, id_criador)
        )

        result = cur.fetchone()
        form_id, created_at = result

        conn.commit()

        # Retornar o formulário criado
        form_data = {
            "id": form_id,
            "nome_formulario": nome_formulario,
            "descricao_formulario": descricao_formulario,
            "categoria": categoria,
            "min_respondentes": min_respondentes,
            "tempo_max_dias": tempo_max_dias,
            "pontos_base": pontos_base,
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
    Method: GET
    Returns: List of all active forms with question count
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Get all active forms with question count
        query = """
            SELECT 
                hf.id, 
                hf.nome_formulario, 
                hf.descricao_formulario, 
                hf.categoria, 
                hf.min_respondentes, 
                hf.pontos_base, 
                hf.created_at,
                COUNT(pf.id_perg) as total_questions
            FROM header_formulario hf
            LEFT JOIN perguntas_form pf ON hf.id = pf.id_form
            WHERE hf.is_active = true
            GROUP BY hf.id, hf.nome_formulario, hf.descricao_formulario, hf.categoria, hf.min_respondentes, hf.pontos_base, hf.created_at
            ORDER BY hf.created_at DESC
        """

        cur.execute(query)
        forms = cur.fetchall()

        # Format results to match frontend expectations
        forms_list = []
        for form in forms:
            (form_id, nome_formulario, descricao_formulario, categoria, 
             min_respondentes, pontos_base, created_at, total_questions) = form

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
                "created_at": created_at.isoformat() if created_at else None,
                "total_questions": total_questions or 0,
                "responses": response_count,
                "criador_nome": "Anônimo"  # Por enquanto, pode ser implementado join com users se necessário
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
    alternativa = data.get("alternativa", "")
    tipagem = data.get("tipagem")

    # Validar campos obrigatórios
    if not id_form or not num_pergunta or not pergunta or not tipagem:
        return jsonify({"success": False, "message": "Campos obrigatórios: id_form, num_pergunta, pergunta, tipagem"}), 400

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
            (id_form, num_pergunta, pergunta, alternativa, tipagem)
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
            "alternativa": alternativa,
            "tipagem": tipagem,
            "created_at": created_at.isoformat() if created_at else None
        }

        return jsonify({
            "success": True,
            "message": "Pergunta criada com sucesso",
            "question": question_data
        }), 201

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
    Method: GET
    Query Params: user_id (required), status (optional), category (optional)
    Returns: List of user's surveys
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

        # Build query with filters
        query = """
            SELECT id, nome_formulario, descricao_formulario, categoria, 
                   min_respondentes, tempo_max_dias, pontos_base, id_criador,
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
            (survey_id, nome_formulario, descricao_formulario, categoria, 
             min_respondentes, tempo_max_dias, pontos_base, id_criador,
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
                "tokenReward": pontos_base,
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
    Method: GET
    Returns: Form details including questions
    """
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Get form details
        cur.execute(
            """
            SELECT id, nome_formulario, descricao_formulario, categoria, 
                   min_respondentes, tempo_max_dias, pontos_base, id_criador,
                   created_at, is_active
            FROM header_formulario 
            WHERE id = %s
            """,
            (form_id,)
        )

        form = cur.fetchone()

        if not form:
            return jsonify({"success": False, "message": "Formulário não encontrado"}), 404

        (form_id_db, nome_formulario, descricao_formulario, categoria, 
         min_respondentes, tempo_max_dias, pontos_base, id_criador,
         created_at, is_active) = form

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
                "alternativa": alternativa,
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
            "id_criador": id_criador,
            "created_at": created_at.isoformat() if created_at else None,
            "is_active": is_active,
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
            (resp_id, user_id_resp, resposta, created_at, perg_id, pergunta, num_pergunta, respondent_name) = row
            
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
                "resposta": resposta
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
        if not id_perg:
            return jsonify({"success": False, "message": "Cada resposta deve ter id_perg e resposta"}), 400
        try:
            id_perg = int(id_perg)
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "id_perg inválido"}), 400
        response_question_ids.append(id_perg)

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

        # Garantir que o payload contém exatamente todas as perguntas do formulário
        cur.execute("SELECT COUNT(*) FROM perguntas_form WHERE id_form = %s", (survey_id,))
        total_questions = cur.fetchone()[0] or 0
        if len(response_question_ids) != total_questions:
            return jsonify({
                "success": False,
                "message": "Responda todas as perguntas para concluir a pesquisa"
            }), 400

        # Validar que todas as perguntas pertencem ao mesmo formulário
        for id_perg in response_question_ids:
            cur.execute("SELECT id_form FROM perguntas_form WHERE id_perg = %s", (id_perg,))
            question_form = cur.fetchone()
            if not question_form or question_form[0] != survey_id:
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
            resposta_text = response.get("resposta")

            if not id_perg or not resposta_text:
                return jsonify({"success": False, "message": f"Cada resposta deve ter id_perg e resposta"}), 400

            # Validar que a pergunta existe
            cur.execute("SELECT id_perg FROM perguntas_form WHERE id_perg = %s", (id_perg,))
            question_exists = cur.fetchone()
            if not question_exists:
                return jsonify({"success": False, "message": f"Pergunta {id_perg} não encontrada"}), 404

            # Inserir ou atualizar resposta (UPSERT)
            cur.execute(
                """
                INSERT INTO resp_form (id_perg, id_user, resposta)
                VALUES (%s, %s, %s)
                ON CONFLICT (id_perg, id_user) 
                DO UPDATE SET resposta = EXCLUDED.resposta, updated_at = CURRENT_TIMESTAMP
                RETURNING id, created_at
                """,
                (id_perg, id_user, resposta_text)
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


@app.route("/api/purchase-intentions", methods=["POST"])
def register_purchase_intention():
    """
    Register a fictional token purchase intention
    Method: POST
    Request Body: {
        "user_id": 3,
        "selected_plan": "Growth",
        "reason": "Melhor custo-benefício",
        "tokens_amount": 150,
        "price": "R$ 69,90"
    }
    Saves in: purchase_intentions table
    Updates user token balance
    """
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
    app.run(debug=True)