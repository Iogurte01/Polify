# Polify Database Schema Documentation

## Overview
This document describes the complete database schema for the Polify SaaS survey platform, including table structures, relationships, and constraints.

## Table Schemas and Relationships

### 1. Users Table
**Purpose:** Stores user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-generated unique user identifier |
| nome | VARCHAR(100) | NOT NULL | User's first name |
| sobrenome | VARCHAR(100) | - | User's last name |
| idade | INTEGER | CHECK (>=0 AND <=150) | User's age |
| cidade | VARCHAR(100) | - | User's city |
| pais | VARCHAR(100) | - | User's country |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (login) |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password for authentication |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Key Features:**
- Auto-generated ID using SERIAL sequence
- Email uniqueness constraint for login
- Password stored as hash (not plain text)
- Automatic timestamp management

### 2. Header_Formulario Table
**Purpose:** Main survey/form definitions and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-generated survey identifier |
| nome_formulario | VARCHAR(255) | NOT NULL | Survey title/name |
| descricao_formulario | TEXT | - | Survey description |
| categoria | VARCHAR(100) | NOT NULL | Survey category (e.g., 'Research', 'Feedback') |
| min_respondentes | INTEGER | DEFAULT 1, CHECK (>=1) | Minimum required respondents |
| tempo_max_dias | INTEGER | CHECK (>=1) | Maximum days for survey completion |
| id_criador | INTEGER | FOREIGN KEY → users.id | Survey creator/owner |
| pontos_base | INTEGER | DEFAULT 0, CHECK (>=0) | Base points for completion |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Survey creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Survey active status |

**Relationships:**
- `id_criador` → `users.id` (One user can create many surveys)

### 3. Perguntas_Form Table
**Purpose:** Individual questions within each survey.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_perg | SERIAL | PRIMARY KEY | Auto-generated question identifier |
| id_form | INTEGER | FOREIGN KEY → header_formulario.id | Parent survey ID |
| num_pergunta | INTEGER | NOT NULL | Question number within survey |
| pergunta | TEXT | NOT NULL | Question text |
| alternativa | TEXT | - | Multiple choice options (JSON format) |
| tipagem | VARCHAR(50) | CHECK (IN('text','multiple_choice','checkbox','rating','date','number')) | Question type |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Question creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- UNIQUE(id_form, num_pergunta) - Ensures unique question numbers within each survey
- `tipagem` validation for supported question types

**Relationships:**
- `id_form` → `header_formulario.id` (One survey has many questions)

### 4. Header_Form_Cont Table
**Purpose:** Tracks user participation and survey completion status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-generated participation identifier |
| id_form | INTEGER | FOREIGN KEY → header_formulario.id | Survey ID |
| id_user | INTEGER | FOREIGN KEY → users.id | User ID |
| date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Participation start timestamp |
| completed | BOOLEAN | DEFAULT FALSE | Completion status |
| completion_date | TIMESTAMP | - | Survey completion timestamp |

**Constraints:**
- UNIQUE(id_form, id_user) - Prevents duplicate participation

**Relationships:**
- `id_form` → `header_formulario.id` (Survey participation)
- `id_user` → `users.id` (User participation)

### 5. Resp_Form Table
**Purpose:** Stores individual user responses to questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-generated response identifier |
| id_perg | INTEGER | FOREIGN KEY → perguntas_form.id_perg | Question ID |
| id_user | INTEGER | FOREIGN KEY → users.id | User ID |
| resposta | TEXT | NOT NULL | Response content |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Response timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- UNIQUE(id_perg, id_user) - One response per question per user

**Relationships:**
- `id_perg` → `perguntas_form.id_perg` (Question being answered)
- `id_user` → `users.id` (User providing response)

## Relationship Diagram

```
Users (1) ----< (Many) Header_Formulario
   |                     |
   |                     | (1) ----< (Many) Perguntas_Form
   |                     |                     |
   |                     |                     | (1) ----< (Many) Resp_Form
   |                     |                     |
   |                     | (1) ----< (Many) Header_Form_Cont ----< (1) Users
   |                     
   (1) ----< (Many) Header_Form_Cont
   (1) ----< (Many) Resp_Form
```

## Key Relationships Summary

1. **User → Surveys**: One user can create multiple surveys
2. **Survey → Questions**: One survey contains multiple questions
3. **Survey → Participation**: One survey can have multiple user participations
4. **User → Participation**: One user can participate in multiple surveys
5. **Question → Responses**: One question can have multiple responses
6. **User → Responses**: One user can provide multiple responses

## Data Integrity Features

### Constraints
- **NOT NULL**: Essential fields cannot be empty
- **UNIQUE**: Email uniqueness, participation uniqueness
- **CHECK**: Age validation, question type validation, positive numbers
- **FOREIGN KEY**: Referential integrity with CASCADE delete

### Indexes
- Performance optimization for common queries
- Email lookup, user searches, survey filtering
- Response statistics and reporting

### Triggers
- Automatic `updated_at` timestamp management
- Ensures data consistency without manual intervention

### Views
- **survey_details**: Survey information with creator details
- **survey_statistics**: Response counts and completion status

## Scalability Considerations

1. **SERIAL IDs**: Efficient auto-incrementing primary keys
2. **Proper Indexing**: Optimized for common query patterns
3. **Constraints**: Data integrity prevents orphaned records
4. **CASCADE Deletes**: Automatic cleanup of related data
5. **Timestamp Management**: Built-in audit trail functionality

## Implementation Notes

1. **User ID Auto-Generation**: Fixed with SERIAL sequence
2. **Migration Support**: Separate script for existing users table updates
3. **Question Types**: Extensible validation for different input types
4. **Participation Tracking**: Complete audit trail of user interactions
5. **Response Flexibility**: TEXT field supports various response formats

This schema provides a robust foundation for a SaaS survey platform with proper data relationships, integrity constraints, and scalability features.
