BEGIN;

ALTER TABLE perguntas_form
    ALTER COLUMN alternativa TYPE JSONB
    USING (
        CASE
            WHEN alternativa IS NULL THEN '[]'::jsonb
            WHEN btrim(alternativa::text) = '' THEN '[]'::jsonb
            WHEN alternativa::text ~ '^\s*\[' THEN alternativa::jsonb
            WHEN alternativa::text ~ '^\s*"' THEN alternativa::jsonb
            ELSE to_jsonb(regexp_split_to_array(alternativa::text, '\s*,\s*'))
        END
    );

ALTER TABLE perguntas_form
    ALTER COLUMN alternativa SET DEFAULT '[]'::jsonb;

ALTER TABLE resp_form
    ALTER COLUMN resposta TYPE JSONB
    USING (
        CASE
            WHEN resposta IS NULL THEN 'null'::jsonb
            WHEN btrim(resposta::text) = '' THEN 'null'::jsonb
            WHEN resposta::text ~ '^\s*\[' THEN resposta::jsonb
            WHEN resposta::text ~ '^\s*\{' THEN resposta::jsonb
            WHEN resposta::text ~ '^\s*"' THEN resposta::jsonb
            WHEN resposta::text ~ '^\s*-?\d+(\.\d+)?\s*$' THEN to_jsonb((resposta::text)::numeric)
            ELSE to_jsonb(resposta::text)
        END
    );

COMMIT;