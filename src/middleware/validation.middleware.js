const validate = (schema, source = "body") => {
    return (req, res, next) => {
        try {
            const dataToValidate = source === "body" ? req.body : source === "query" ? req.query : req.params;
            const parsed = schema.parse(dataToValidate);
            
            // Re-assign sanitized/parsed values
            if (source === "body") {
                req.body = parsed;
            } else if (source === "query") {
                req.query = parsed;
            } else {
                req.params = parsed;
            }
            
            next();
        } catch (error) {
            if (error.errors) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }));
                return res.status(400).json({
                    message: "Validation failed",
                    errors: errorMessages
                });
            }
            return res.status(400).json({
                message: "Validation failed",
                error: error.message
            });
        }
    };
};

module.exports = validate;
