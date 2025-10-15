module.exports = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, error: error.details.map((d) => d.message).join(', ') });
  }
  req[property] = value;
  next();
};
