CREATE OR REPLACE FUNCTION prevent_duplicate_application_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR LOWER(NEW.email) IS DISTINCT FROM LOWER(OLD.email) THEN
        PERFORM pg_advisory_xact_lock(
            hashtextextended(LOWER(NEW.email), 0)
        );

        IF EXISTS (
            SELECT 1
            FROM "scholarship_applications"
            WHERE LOWER("email") = LOWER(NEW.email)
              AND "id" <> NEW.id
        ) THEN
            RAISE unique_violation
                USING MESSAGE = 'An application already exists for this email address.',
                      CONSTRAINT = 'scholarship_applications_email_unique';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER scholarship_applications_unique_email
BEFORE INSERT OR UPDATE OF "email"
ON "scholarship_applications"
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_application_email();
